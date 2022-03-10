import { ComponentOption } from '../../app/src/typings/editor';
import farrowHttp from 'farrow-http';
import farrowCors from 'farrow-cors';
import { getLoaclComponents } from '../plugins/component-meta.js';
import { getFileInfo } from '../plugins/file-meta.js';
import { getContext, updatePreview } from './project.js';
import './socket.js';
import { resolve } from 'path';

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
  .match({
    url: '/preview',
    method: 'post',
    body: {
      option: String,
      block: String,
    },
  })
  .use(async (req) => {
    try {
      if (req.body.option) {
        const option: ComponentOption = JSON.parse(req.body.option);
        await updatePreview({
          block: req.body.block,
          option,
        });
      } else {
        await updatePreview({
          block: req.body.block,
        });
      }
      return Response.text('ok');
    } catch (err) {
      console.log(err);
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
