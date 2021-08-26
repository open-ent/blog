import angular, { IController } from "angular";
import { IIdiom, IUserInfo, APP } from 'ode-ts-client';
import { OdeModules, conf, session } from 'ode-ngjs-front';

export class AppController implements IController {
	me: IUserInfo;
	currentLanguage: string;
	lang: IIdiom;

	// IController implementation
	$onInit(): void {
		this.initialize();
	}

	private async initialize():Promise<void> {
		const platformConf = conf().Platform;
		this.me = session().user;
		this.currentLanguage = session().currentLanguage;
		this.lang = platformConf.idiom;
	}
};

angular.module("app", [OdeModules.getBase(), OdeModules.getI18n(), OdeModules.getUi(), OdeModules.getExplorer()])
.controller("appCtrl", ['$scope', AppController]);

conf().Platform.apps.initialize(APP.BLOG);
