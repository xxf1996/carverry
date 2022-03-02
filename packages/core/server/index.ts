import farrowHttp from 'farrow-http';
import { getLoaclComponents } from '../plugins/component-meta.js';
import { getContext } from './project.js';

const { Http, Router, Response } = farrowHttp;
const http = Http();
const components = Router();

http
  .route('/components')
  .use(components);

http
  .get('/context')
  .use(async () => {
    const data = await getContext();
    return Response.json(data);
  });

components
  .get('/local')
  .use(async () => {
    const data = await getLoaclComponents();
    return Response.json(data);
  });

http.listen(3344);
