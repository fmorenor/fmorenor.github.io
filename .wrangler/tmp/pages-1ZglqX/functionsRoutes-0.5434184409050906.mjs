import { onRequestPost as __api_chat_js_onRequestPost } from "/Users/franciscomoreno/ai-lab/CartoData/functions/api/chat.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "/Users/franciscomoreno/ai-lab/CartoData/functions/api/upload.js"
import { onRequest as __api_upload_image_js_onRequest } from "/Users/franciscomoreno/ai-lab/CartoData/functions/api/upload-image.js"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  {
      routePath: "/api/upload-image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_upload_image_js_onRequest],
    },
  ]