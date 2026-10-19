import {execFileSync} from 'node:child_process';

export function databaseSQL(query:string,database:string):string{
  let path:string;
  try{path=new URL(database).pathname;}
  catch{throw new Error('Configure a valid private PostgreSQL test URL');}
  if(!path.endsWith('_test'))throw new Error('Fault tests require an isolated database ending _test');
  try{
    return execFileSync('psql',['-X',database,'-v','ON_ERROR_STOP=1','-At'],{
      encoding:'utf8',input:query,
      stdio:['pipe','pipe','pipe'],timeout:15000,
    }).trim();
  }catch{
    // Keep driver diagnostics and private SQL/connection details out of reported errors.
    throw new Error('Database verification failed; check the isolated test database and SQL constraints privately');
  }
}
