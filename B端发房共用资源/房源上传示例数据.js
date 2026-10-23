/* 数据平台的只读示例快照。沿用真实演示请求结构，不写入APP/企微的操作记录。 */
(() => {
  const brokers={
    'example-broker-zhang':{id:'example-broker-zhang',name:'张经理',city:'西安'},
    'example-broker-li':{id:'example-broker-li',name:'李顾问',city:'西安'}
  },houses=[],relations={},tasks=[];
  const names=['御锦城','保利心语花园','金地湖城大境','龙湖香醍国际','恒大绿洲','中海曲江大城','华润悦府','万科翡翠国宾'];
  const at=(h,m=0,s=0)=>`2026-10-22 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  let serial=0;
  function item(kind='waiting',extra={}){
    const no=++serial,source=no%2?'贝壳':'安居客',sourceId=source==='贝壳'?String(101140500000+no):'A'+String(7534260000+no),domain=source==='贝壳'?'ke.com':'anjuke.com',key=domain+'|610100|'+sourceId;
    const url=source==='贝壳'?`https://xa.ke.com/ershoufang/${sourceId}.html`:`https://m.anjuke.com/xa/sale/${sourceId}/`;
    const i={key,domain,source,sourceId,city:'西安',cityId:'610100',url,index:0,status:'waiting',associationStatus:'not_started',duplicates:0,revision:0,events:[{label:'识别通过，进入逐套处理',time:at(9,1)}],...extra};
    if(kind==='processing'){i.status='business';i.startedAt=1;i.events.push({label:'来源数据已收录，正在生产业务房源',time:at(9,2)});}
    if(['ready','association-failed','duplicate','expired'].includes(kind)){
      const community=names[(no-1)%names.length],house={key,domain,source,sourceId,id:'H-XA-'+sourceId,city:'西安',cityId:'610100',community,title:community+' 3室 南北通透',price:108+no,room:3,bath:2,area:95+no,channel:'第三方',district:'浐灞国际港',block:'浐河西路',status:kind==='expired'?'下架':'上架',collectedAt:at(9,2),updatedAt:at(9,3),shortLink:'https://m.house365.com/house/H-XA-'+sourceId};
      Object.assign(house,window.HousingDemo.communityIds(source,community),{firstIngestTrigger:kind==='duplicate'?'platform_task':'link_upload',relationUpdatedAt:at(9,4)});houses.push(house);Object.assign(i,{status:'ready',startedAt:1,collected:true,houseId:house.id,shortLink:house.shortLink,associationStatus:'associated',associatedAt:at(9,4),readyAt:at(9,4)});
      i.events.push({label:'业务房源已供下游消费，平台短链就绪',time:at(9,3)});
      if(kind==='association-failed'){i.status='failed';i.associationStatus='failed';delete i.associatedAt;delete i.readyAt;i.error='房源已收录，加入我的房源失败，未通知上传成功。';i.events.push({label:i.error,time:at(9,4)});}
      else if(kind==='duplicate'){i.status='ready';i.resultCode='already_in_my_houses';i.reusedHouse=true;i.reusedRelation=true;i.associatedAt=at(7,45);house.collectedAt=at(7,40);house.updatedAt=at(7,44);i.error='';i.events.push({label:'我的房源已有，复用现有房源和本人关系，处理成功',time:at(9,4)});}
      else if(kind==='expired'){i.status='failed';i.associationStatus='not_started';delete i.associatedAt;delete i.readyAt;i.error='来源房源已失效，暂不可用，未加入我的房源。';i.events.push({label:i.error,time:at(9,3)});}
      else i.events.push({label:'本人房源关系写入完成，本套上传成功',time:at(9,4)});
    }
    if(kind==='collection-failed'){i.status='failed';i.startedAt=1;i.error='来源暂时无法访问，本套采集失败，未形成业务房源。';i.events.push({label:i.error,time:at(9,2)});}
    if(kind==='invalid'){i.key='invalid-example-'+no;i.source='安居客';i.domain='anjuke.com';i.sourceId='';i.status='failed';i.error='链接缺少房源ID，请提供完整的西安房源详情链接。';i.url='https://m.anjuke.com/xa/sale/';i.events=[{label:i.error,time:at(9,1)}];}
    return i;
  }
  function request(id,title,entry,status,kinds,opt={}){
    const owner=opt.noIdentity?'':'example-broker-'+(entry==='private'?'zhang':'li'),time=at(8,tasks.length*4%60),items=kinds.map((kind,index)=>({...item(kind),index}));
    const uploadEntry=entry==='private'?'wecom_service':opt.chat?'app_chat':'app_upload',t={id:'EX-UP-'+id,demoSnapshot:true,demoTitle:title,city:'西安',cityId:'610100',owner,recordViewer:owner,submitterName:owner?brokers[owner].name:'身份未确认',entry,uploadEntry,status,time,created:Date.parse(time.replace(' ','T')+'+08:00'),items,text:'请帮忙上传以下房源：'+'\n'+items.map(i=>i.url).join('\n')};
    for(const k of ['admissionError','text','duplicateSubmissions'])if(opt[k]!==undefined)t[k]=opt[k];
    if(!['processing','sending'].includes(status))t.finishedAt=at(10,1);
    items.forEach(i=>{if(i.associationStatus==='associated'&&owner)relations[owner+'|'+i.key]={active:true,associatedAt:i.associatedAt,updatedAt:i.associatedAt,entry:entry==='private'?'private':uploadEntry==='app_chat'?'chat':'app',requestId:t.id};});
    tasks.push(t);return t;
  }
  request('001','企微一次上传3套，全部成功','private','completed',['ready','ready','ready']);
  request('002','APP一次上传2套，全部成功','app','completed',['ready','ready']);
  request('003','客户会话3套上传成功','app','completed',['ready','ready','ready'],{chat:true});
  request('004','10套已受理，等待开始串行处理','app','processing',Array(10).fill('waiting'));
  request('005','10套串行：第1套上传成功，第2套处理中，其余等待','app','processing',['ready','processing',...Array(8).fill('waiting')],{chat:true,duplicateSubmissions:1});
  request('006','企微3套：1套成功、1套处理中、1套等待','private','processing',['ready','processing','waiting']);
  request('007','APP5套：成功3套、失效/格式错误各1套','app','partial',['ready','ready','expired','duplicate','invalid']);
  request('008','会话4套：3套上传成功、1套采集失败','app','partial',['ready','ready','collection-failed','ready'],{chat:true});
  request('009','身份未通过，仅保留原始提交消息','private','partial',[],{noIdentity:true,admissionError:'无法确认已入驻平台的安家顾问身份，未受理、未解析房源链接。',text:'您好，请帮忙上传房源：\n'+window.HousingDemo.sample.bk+'\n'+window.HousingDemo.sample.ajk});
  request('010','APP3套全部未完成，失败原因分别展示','app','partial',['collection-failed','association-failed','invalid']);
  request('011','会话4套处理中取消，保留上传成功的第1套','app','cancelled',['ready','waiting','waiting','waiting'],{chat:true});
  request('012','独立上传2套尚未执行，已取消','app','cancelled',['waiting','waiting']);
  request('013','企微再次上传2套，均上传成功','private','completed',['duplicate','duplicate']);
  window.HousingUploadExamples={merge(state){const copy=JSON.parse(JSON.stringify({brokers,houses,relations,tasks}));return {...state,brokers:{...copy.brokers,...state.brokers},houses:[...state.houses,...copy.houses],relations:{...copy.relations,...state.relations},tasks:[...copy.tasks,...state.tasks]};},count:tasks.length};
})();
