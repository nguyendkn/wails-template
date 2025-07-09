export namespace config {
	
	export class PublicAPIConfig {
	    timeout: number;
	    retryCount: number;
	
	    static createFrom(source: any = {}) {
	        return new PublicAPIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timeout = source["timeout"];
	        this.retryCount = source["retryCount"];
	    }
	}
	export class PublicAppConfig {
	    environment: string;
	    name: string;
	    version: string;
	    debug: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PublicAppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.environment = source["environment"];
	        this.name = source["name"];
	        this.version = source["version"];
	        this.debug = source["debug"];
	    }
	}
	export class PublicWindowConfig {
	    width: number;
	    height: number;
	    resizable: boolean;
	    fullscreen: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PublicWindowConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.resizable = source["resizable"];
	        this.fullscreen = source["fullscreen"];
	    }
	}
	export class PublicConfig {
	    app: PublicAppConfig;
	    api: PublicAPIConfig;
	    window: PublicWindowConfig;
	
	    static createFrom(source: any = {}) {
	        return new PublicConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.app = this.convertValues(source["app"], PublicAppConfig);
	        this.api = this.convertValues(source["api"], PublicAPIConfig);
	        this.window = this.convertValues(source["window"], PublicWindowConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class User {
	    id: string;
	    username: string;
	    name: string;
	    email: string;
	    gender: string;
	    roles: string[];
	    scopes: string[];
	    created_at: string;
	    current_tenant_id: string;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.name = source["name"];
	        this.email = source["email"];
	        this.gender = source["gender"];
	        this.roles = source["roles"];
	        this.scopes = source["scopes"];
	        this.created_at = source["created_at"];
	        this.current_tenant_id = source["current_tenant_id"];
	    }
	}
	export class LoginData {
	    access_token: string;
	    expires_in: number;
	    token_type: string;
	    refresh_token: string;
	    user: User;
	
	    static createFrom(source: any = {}) {
	        return new LoginData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.access_token = source["access_token"];
	        this.expires_in = source["expires_in"];
	        this.token_type = source["token_type"];
	        this.refresh_token = source["refresh_token"];
	        this.user = this.convertValues(source["user"], User);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LoginResponse {
	    code: string;
	    success: boolean;
	    statusCode: number;
	    message: string;
	    data: LoginData;
	
	    static createFrom(source: any = {}) {
	        return new LoginResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.success = source["success"];
	        this.statusCode = source["statusCode"];
	        this.message = source["message"];
	        this.data = this.convertValues(source["data"], LoginData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

