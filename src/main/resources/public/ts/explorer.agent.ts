import { AbstractBusAgent, ACTION, GetContextParameters, IActionParameters, IActionResult, IContext, IHttp, ManagePropertiesParameters, ManagePropertiesResult, PROP_KEY, PROP_MODE, PROP_TYPE, RESOURCE, UpdatePropertiesParameters, UpdatePropertiesResult, DeleteParameters } from 'ode-ts-client';
import { TransportFrameworkFactory } from 'ode-ts-client';
import { IHandler } from 'ode-ts-client/dist/ts/explore/Agent';

console.log("Blog agent loading....");
class BlogAgent extends AbstractBusAgent {
    constructor() {
        super( RESOURCE.BLOG );
		this.registerHandlers();	
        console.log("Blog agent initialized!");
    }

    protected ctx:IContext|null = null;
    protected http:IHttp = TransportFrameworkFactory.instance().newHttpInstance();
    protected checkHttpResponse:<R>(result:R)=>R = result => {
        if( this.http.latestResponse.status>=300 ) {
            throw this.http.latestResponse.statusText;
        }
        return result;
    }

    public registerHandlers(): void {
        this.setHandler( ACTION.OPEN,   	this.openBlog as unknown as IHandler );
        this.setHandler( ACTION.CREATE,   	this.createBlog as unknown as IHandler );
        this.setHandler( ACTION.MANAGE,     this.onManage as unknown as IHandler );
        this.setHandler( ACTION.UPD_PROPS,  this.onUpdateProps as unknown as IHandler );
    }

    openBlog( parameters:any ): void {
        window.open( `/blog#/view/${parameters.resourceId}` );
    }

    createBlog( parameters:IActionParameters ): void {
        window.open( `/blog#/edit/new` );
    }

    onManage( parameters:ManagePropertiesParameters ): Promise<ManagePropertiesResult> {
        const res:ManagePropertiesResult = {
            genericProps:[{
                key:PROP_KEY.TITLE
            },{
                key:PROP_KEY.IMAGE
            },{
                key:PROP_KEY.URL
            }]
        }
        return Promise.resolve().then( () => res );
    }

    onUpdateProps( parameters:UpdatePropertiesParameters ): Promise<UpdatePropertiesResult> {
        const res:UpdatePropertiesResult = {
            resources: parameters.resources
        }
        alert( "TODO: update properties" );
        return Promise.resolve().then( () => res );
    }
}

let agent = new BlogAgent();
