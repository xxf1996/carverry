import farrowHttp from 'farrow-http';
import { getContext } from './project.js';

const { Http, Response } = farrowHttp;
const http = Http();

http
  .get('/context')
  .use(async () => {
    const data = await getContext();
    return Response.json(data);
  });

http.listen(3344);
