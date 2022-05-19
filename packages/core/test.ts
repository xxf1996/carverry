import { runCli, parseNr } from '@antfu/ni';

process.argv.push('-C', '/Users/xuefengxie/Desktop/project/yisight-fe', 'cr'); // -C可以指定cwd；https://github.com/antfu/ni#change-directory

console.log(process.argv);

runCli(parseNr);
