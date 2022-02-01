import angular from "angular";
import { APP } from "ode-ts-client";
import { OdeModules, conf, Explorer, Sidebar, SidebarFolder, ResourceList, DominoFolder, DominoItem, Toaster, Modal, PropsPanel, SharePanel } from 'ode-ngjs-front';
import { AppController } from "./controller";

angular.module("app", [OdeModules.getBase(), OdeModules.getI18n(), OdeModules.getUi()])
.controller("appCtrl", ['$scope', AppController])
.directive("odeExplorer", Explorer.DirectiveFactory)
.directive("odeSidebar", Sidebar.DirectiveFactory)
.directive("odeSidebarFolder", SidebarFolder.DirectiveFactory)
.directive("odeResourceList", ResourceList.DirectiveFactory)
.directive("odeDominoFolder", DominoFolder.DirectiveFactory)
.directive("odeDominoItem", DominoItem.DirectiveFactory)
.directive("odePropsPanel", PropsPanel.DirectiveFactory)
.directive("odeSharePanel", SharePanel.DirectiveFactory)

conf().Platform.apps.initialize(APP.BLOG);