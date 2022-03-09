import { ComponentOption } from '../../app/src/typings/editor';
import farrowHttp from 'farrow-http';
import farrowCors from 'farrow-cors';
import { getLoaclComponents } from '../plugins/component-meta.js';
import { getFileInfo } from '../plugins/file-meta.js';
import { getContext, updatePreview } from './project.js';

const { Http, Router, Response } = farrowHttp;
const { cors } = farrowCors;
const http = Http();
const components = Router();

http.use(cors()); // 跨域支持

http
  .route('/components')
  .use(components);

http
  .get('/context')
  .use(async () => {
    const data = await getContext();
    return Response.json(data);
  });

http
  .get('/files')
  .use(async () => {
    const data = await getFileInfo();
    return Response.json(data);
  });

http
  .post('/preview', {
    body: {
      config: String,
    },
  })
  .use(async (req) => {
    try {
      const config: ComponentOption = JSON.parse(req.body.config);
      await updatePreview(config);
      return Response.text('ok');
    } catch (err) {
      return Response.text('error');
    }
  });

components
  .get('/local')
  .use(async () => {
    const data = await getLoaclComponents();
    return Response.json(data);
  });

http.listen(3344);
