import { AbstractBusAgent, ACTION, GetContextParameters, OpenParameters, IActionParameters, IActionResult, IContext, IHttp, ManagePropertiesParameters, ManagePropertiesResult, PROP_KEY, PROP_MODE, PROP_TYPE, RESOURCE, UpdatePropertiesParameters, UpdatePropertiesResult } from 'ode-ts-client';
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
    //protected http:IHttp = TransportFrameworkFactory.instance().http;

    public registerHandlers(): void {
        this.setHandler( ACTION.OPEN,   	this.onOpen as unknown as IHandler );
        this.setHandler( ACTION.CREATE,   	this.onCreate as unknown as IHandler );
        this.setHandler( ACTION.MANAGE,     this.onManage as unknown as IHandler );
        this.setHandler( ACTION.UPD_PROPS,  this.onUpdateProps as unknown as IHandler );
    }

    onOpen( parameters:OpenParameters ): void {
        window.open( `/blog#/view/${parameters.resourceId}` );
    }

    onCreate( parameters:IActionParameters ): Promise<IActionResult> {
        const res:IActionResult = "/blog#/edit/new";
        return Promise.resolve().then( () => res );
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
