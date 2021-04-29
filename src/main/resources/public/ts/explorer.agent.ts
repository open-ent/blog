import http from 'axios';
import { AbstractBusAgent, ACTION, GetContextParameters, IActionParameters, IActionResult, IContext, ManagePropertiesParameters, ManagePropertiesResult, PROP_KEY, PROP_MODE, PROP_TYPE, RESOURCE, UpdatePropertiesParameters, UpdatePropertiesResult } from 'ode-ts-client';
import { IHandler } from 'ode-ts-client/dist/ts/explore/Agent';

console.log("agent loading....")
class BlogAgent extends AbstractBusAgent {
    constructor() {
        super( RESOURCE.BLOG );
		this.registerHandlers();	
        console.log("agent initialized....")	
    }

    protected ctx:IContext|null = null;

    protected registerHandlers(): void {
        this.setHandler( ACTION.OPEN,   	this.onOpen as unknown as IHandler );
        this.setHandler( ACTION.CREATE,   	this.onCreate as unknown as IHandler );
        this.setHandler( ACTION.MANAGE,     this.onManage as unknown as IHandler );
        this.setHandler( ACTION.UPD_PROPS,  this.onUpdateProps as unknown as IHandler );
    }

    onOpen( parameters:GetContextParameters ): void {
        // TODO navigate to the correct URL. 
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