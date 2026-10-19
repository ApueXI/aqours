import {execFileSync} from 'node:child_process';

export function databaseSQL(query:string,database:string):string{
  let path:string;
  try{path=new URL(database).pathname;}
  catch{throw new Error('Configure a valid private PostgreSQL test URL');}
  if(!path.endsWith('_test'))throw new Error('Fault tests require an isolated database ending _test');
  try{
    return execFileSync('psql',['-X',database,'-v','ON_ERROR_STOP=1','-Atc',query],{
      encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:15000,
    }).trim();
  }catch{
    // execFileSync errors contain command arguments, including private connection URLs.
    throw new Error('Database verification failed; check the isolated test database and SQL constraints privately');
  }
}
