// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {config} from '../models';
import {main} from '../models';

export function GetAPIBaseURL():Promise<string>;

export function GetAppInfo():Promise<Record<string, any>>;

export function GetConfig():Promise<config.PublicConfig>;

export function GetEnvironment():Promise<string>;

export function Greet(arg1:string):Promise<string>;

export function IsDebugMode():Promise<boolean>;

export function Login(arg1:string,arg2:string):Promise<main.LoginResponse>;

export function ReloadConfig():Promise<void>;
