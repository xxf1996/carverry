import { ComponentOption, TemplateInfo } from '../../app/src/typings/editor';
import farrowHttp from 'farrow-http';
import farrowCors from 'farrow-cors';
import { getLoaclComponents, getRemoteComponents } from '../plugins/component-meta.js';
import { getFileInfo } from '../plugins/file-meta.js';
import { addBlock, generateBlock, getBlockConfig, getBlocks, getContext, updatePreview } from './project.js';
import './socket.js';
import { addTemplate, getTemplates } from '../plugins/template.js';
import { installPackage } from '../utils/shell.js';

const { Http, Router, Response } = farrowHttp;
const { cors } = farrowCors;
const http = Http();
const components = Router();
const templates = Router();

http.use(cors()); // 跨域支持

http
  .route('/components')
  .use(components);
http
  .route('/templates')
  .use(templates);

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

http
  .match({
    url: '/generate',
    method: 'post',
    body: {
      option: String,
      block: String,
    },
  })
  .use(async (req) => {
    try {
      const option: ComponentOption = JSON.parse(req.body.option);
      await generateBlock({
        option,
        block: req.body.block,
      });
      return Response.text('ok');
    } catch (err) {
      console.log(err);
      return Response.text('error');
    }
  });

http
  .match({
    url: '/block',
    method: 'post',
    body: {
      name: String,
    },
  })
  .use(async (req) => {
    await addBlock(req.body.name);
    return Response.text('ok');
  });

http
  .get('/block')
  .use(async () => {
    const blocks = await getBlocks();
    return Response.json(blocks);
  });

http
  .match({
    url: '/config/<name:string>',
    method: 'get',
  })
  .use(async (req) => {
    const config = await getBlockConfig(req.params.name);
    return Response.json(config);
  });

http
  .match({
    url: '/install',
    method: 'post',
    body: {
      name: String,
    },
  })
  .use(async (req) => {
    await installPackage(req.body.name);
    return Response.text('ok');
  });

components
  .get('/local')
  .use(async () => {
    const data = await getLoaclComponents();
    return Response.json(data);
  });

components
  .get('/remote')
  .use(async () => {
    const data = await getRemoteComponents();
    return Response.json(data);
  });

templates
  .get('/all')
  .use(async () => {
    const data = await getTemplates();
    return Response.json(data);
  });
templates
  .match({
    method: 'post',
    url: '/add',
    body: {
      config: String,
    },
  })
  .use(async (req) => {
    const info: TemplateInfo = JSON.parse(req.body.config);
    await addTemplate(info);
    return Response.text('ok');
  });

http.listen(3344);
