import{N as j,d as S,b as _,S as h,e as v,W as P,Q as C,n as I,j as e,B as $,U as y,V as E,r as c,Y as L,Z as V,$ as k,a0 as A}from"./index-XY-EGNwC.js";import"/assets/js/edifice-ts-client/index.js";const B=c.lazy(async()=>await A(()=>import("./ResourceModal-0014_dww.js"),__vite__mapDeps([0,1,2])));function T(){const[l,a]=j(),{appCode:s}=S(),{t:n}=_(s),{clearSelectedItems:i,clearSelectedIds:d}=h(),{data:r}=v(),u=r==null?void 0:r.find(t=>t.id==="create"),o=P(),p=C(),m=I();return u?e.jsxs(e.Fragment,{children:[e.jsx($,{type:"button",color:"primary",variant:"filled",leftIcon:e.jsx(y,{}),className:"ms-auto",onClick:()=>{if(s=="scrapbook"){E({searchParams:m,folderId:o.id});return}i(),d(),a()},children:n("explorer.create.title")}),e.jsx(c.Suspense,{fallback:e.jsx(L,{}),children:l&&e.jsx(B,{mode:"create",currentFolder:o,createResource:p,isOpen:l,onSuccess:a,onCancel:a,children:(t,x,b,f,g)=>s==="blog"&&V("createPublic",r)&&e.jsx(k,{appCode:s,isUpdating:x,resource:t,watch:b,setValue:f,register:g})})})]}):null}export{T as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["public/ResourceModal-0014_dww.js","public/index-XY-EGNwC.js","public/index-I4KjTQ5m.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
