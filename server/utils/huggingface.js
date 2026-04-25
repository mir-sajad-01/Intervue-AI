const normalizeImageInput = (imageBase64) => {
  if (!imageBase64) return '';

  if (imageBase64.startsWith('data:image')) return imageBase64;
  if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) return imageBase64;

  return `data:image/jpeg;base64,${imageBase64}`;
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const getEmotionEndpoints = () => {
  const baseUrl = process.env.HF_SPACE_URL?.replace(/\/$/, '');
  return unique([
    process.env.HF_API_URL,
    baseUrl ? `${baseUrl}/gradio_api/run/predict_emotion` : null,
    baseUrl ? `${baseUrl}/run/predict_emotion` : null
  ]);
};

const getSpaceBaseUrl = (endpoint) => {
  if (process.env.HF_SPACE_URL) return process.env.HF_SPACE_URL.replace(/\/$/, '');
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
};

const getApiRoot = (endpoint) => {
  const baseUrl = getSpaceBaseUrl(endpoint);
  return endpoint.includes('/gradio_api/') ? `${baseUrl}/gradio_api` : baseUrl;
};

const parsePrediction = (result) => {
  const prediction = result?.data?.[0];
  if (!prediction?.label) {
    throw new Error(`Invalid Hugging Face response: ${JSON.stringify(result).slice(0, 500)}`);
  }

  return {
    emotion: prediction.label,
    confidence: Number(prediction.confidences?.[0]?.confidence ?? 0),
    allEmotions: prediction.confidences ?? []
  };
};

const randomSessionHash = () => Math.random().toString(36).slice(2, 12);

const getFunctionIndex = async (apiRoot) => {
  const response = await fetch(`${apiRoot}/config`);
  if (!response.ok) return 0;

  const config = await response.json();
  const dependencies = config.dependencies || [];
  const dependency = dependencies.find((item) => {
    const apiName = String(item.api_name || '').replace(/^\//, '');
    return apiName === 'predict_emotion';
  });

  return Number.isInteger(dependency?.id) ? dependency.id : 0;
};

const readQueueResult = async (response) => {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Gradio queue response stream unavailable');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const dataLine = chunk
        .split('\n')
        .find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const message = JSON.parse(dataLine.replace(/^data:\s*/, ''));
      if (message.msg === 'process_completed') {
        if (message.success === false || message.output?.error) {
          throw new Error(`Gradio queue failed: ${message.output?.error || JSON.stringify(message).slice(0, 500)}`);
        }
        return message.output;
      }
    }
  }

  throw new Error('Gradio queue ended before completion');
};

const callQueueEndpoint = async (endpoint, imageInput) => {
  const apiRoot = getApiRoot(endpoint);
  const sessionHash = randomSessionHash();
  const fnIndex = await getFunctionIndex(apiRoot);
  const joinUrl = `${apiRoot}/queue/join`;

  console.log(`Joining Hugging Face Gradio queue: ${joinUrl}`);

  const joinResponse = await fetch(joinUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [imageInput],
      fn_index: fnIndex,
      session_hash: sessionHash
    })
  });

  if (!joinResponse.ok) {
    const body = await joinResponse.text();
    throw new Error(`Gradio queue join failed: ${joinResponse.status} ${body}`);
  }

  const dataResponse = await fetch(`${apiRoot}/queue/data?session_hash=${sessionHash}`, {
    headers: { Accept: 'text/event-stream' }
  });

  if (!dataResponse.ok) {
    const body = await dataResponse.text();
    throw new Error(`Gradio queue data failed: ${dataResponse.status} ${body}`);
  }

  return readQueueResult(dataResponse);
};

const callPredictEndpoint = async (endpoint, imageInput) => {
  const payload =
    imageInput && typeof imageInput === 'object' && imageInput.__rawPayload
      ? imageInput.__rawPayload
      : { data: [imageInput] };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Hugging Face request failed: ${response.status} ${body}`);
  }

  return response.json();
};

const dataUrlToFile = (dataUrl) => {
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid webcam image data URL');
  }

  const [, mimeType, base64] = match;
  const extension = mimeType.split('/')[1] || 'jpg';
  return {
    blob: new Blob([Buffer.from(base64, 'base64')], { type: mimeType }),
    filename: `webcam-frame.${extension}`
  };
};

const extractUploadedPath = (payload) => {
  const first = Array.isArray(payload) ? payload[0] : payload;
  if (typeof first === 'string') return first;
  if (first?.path) return first.path;
  if (first?.name) return first.name;
  throw new Error(`Invalid Gradio upload response: ${JSON.stringify(payload).slice(0, 500)}`);
};

const uploadImageToSpace = async (spaceBaseUrl, imageDataUrl) => {
  const { blob, filename } = dataUrlToFile(imageDataUrl);
  const formData = new FormData();
  formData.append('files', blob, filename);

  const uploadUrls = [`${spaceBaseUrl}/gradio_api/upload`, `${spaceBaseUrl}/upload`];
  let lastError;

  for (const uploadUrl of uploadUrls) {
    console.log(`Uploading webcam frame to Hugging Face Space: ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      return extractUploadedPath(await response.json());
    }

    const body = await response.text();
    lastError = new Error(`Hugging Face upload failed at ${uploadUrl}: ${response.status} ${body}`);
  }

  throw lastError;
};

export const analyzeEmotion = async (imageBase64) => {
  const endpoints = getEmotionEndpoints();
  if (!endpoints.length) {
    throw new Error('HF_API_URL or HF_SPACE_URL is not configured');
  }

  const imageInput = normalizeImageInput(imageBase64);

  let lastError;
  for (const endpoint of endpoints) {
    console.log(`Calling Hugging Face emotion Space: ${endpoint}`);

    try {
      return parsePrediction(await callPredictEndpoint(endpoint, imageInput));
    } catch (directError) {
      lastError = directError;

      if (String(directError.message).includes('join the queue')) {
        try {
          return parsePrediction(await callQueueEndpoint(endpoint, imageInput));
        } catch (queueError) {
          lastError = queueError;
        }
      }

      if (!imageInput.startsWith('data:image')) {
        continue;
      }

      console.warn(`Direct HF image call failed at ${endpoint}, retrying with Gradio upload: ${directError.message}`);

      try {
        const uploadedPath = await uploadImageToSpace(getSpaceBaseUrl(endpoint), imageInput);

        const uploadedVariants = [
          {
            path: uploadedPath,
            url: uploadedPath,
            orig_name: 'webcam-frame.jpg',
            mime_type: 'image/jpeg',
            meta: { _type: 'gradio.FileData' }
          },
          { path: uploadedPath },
          uploadedPath,
          {
            __rawPayload: {
              data: [uploadedPath],
              fn_index: 0
            }
          }
        ];

        for (const variant of uploadedVariants) {
          try {
            return parsePrediction(await callPredictEndpoint(endpoint, variant));
          } catch (error) {
            lastError = error;
            if (String(error.message).includes('join the queue')) {
              try {
                return parsePrediction(await callQueueEndpoint(endpoint, variant));
              } catch (queueError) {
                lastError = queueError;
              }
            }
          }
        }
      } catch (uploadError) {
        lastError = uploadError;
      }
    }
  }

  throw lastError;
};
