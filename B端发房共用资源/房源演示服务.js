/* 本地交互原型共用演示服务；不连接生产系统。 */
(() => {
  const KEY='365-housing-upload-demo-20261022-r3',OWNER='broker-demo-xa';
  const cities={xa:{id:'610100',name:'西安'},xian:{id:'610100',name:'西安'},nj:{id:'320100',name:'南京'},nanjing:{id:'320100',name:'南京'}};
  const sample={bk:'https://xa.ke.com/ershoufang/101140402577.html?fb_expo_id=1165667476605612033',bkH5:'https://m.ke.com/xa/ershoufang/101139343423.html?shareSource=beike_app',ajk:'https://m.anjuke.com/xa/sale/A7534253838/?isauction=222',ajk2:'https://xian.anjuke.com/prop/view/S4624826410476559',invalid:'https://m.anjuke.com/xa/sale/'};
  // 仅供原型演示近期结果复用；正式采集时效由现有来源策略确定，PRD不承诺此时长。
  const DEMO_FRESH_MS=60000;
  let listeners=new Set();
  const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});
  // 本地示例的既有小区识别结果，不代表生产中按名称直接匹配。
  function communityIds(source,name){const code=Array.from(name||'').reduce((n,ch)=>(n*31+ch.codePointAt(0))>>>0,0).toString(36);return {sourceCommunityId:'SC-XA-'+(source==='贝壳'?'BK':'AJK')+'-'+code,masterCommunityId:'MC-XA-'+code};}
  // 同一份数据平台主小区的本地只读查询样例；包含尚无可用房源的小区，不从房源列表反推候选。
  function masterCommunitySeed(){return [['御锦城',['御锦城社区']],['保利心语花园',['保利心语']],['金地湖城大境',['湖城大境']],['龙湖香醍国际',['香醍国际']],['恒大绿洲',[]],['中海曲江大城',[]],['华润悦府',[]],['万科翡翠国宾',[]],['天朗大兴郡',['天朗大兴']]].map(([name,aliases])=>({id:communityIds('',name).masterCommunityId,name,aliases,alias:aliases.join('、'),city:'西安市',cityId:'610100',district:name==='天朗大兴郡'?'莲湖区':'浐灞国际港',block:name==='天朗大兴郡'?'大兴新城':'浐河西路'}));}
  function searchMasterCommunities(keyword,cityId='610100'){const q=String(keyword||'').trim().toLowerCase();return q?get().masterCommunities.filter(c=>c.cityId===cityId&&!c.mergedInto&&[c.name,...(c.aliases||[])].some(v=>String(v).toLowerCase().includes(q))).sort((a,b)=>Number(b.name===q)-Number(a.name===q)||a.name.localeCompare(b.name,'zh-CN')).slice(0,10):[];}
  function house(source,id,community,price,room,area,owner=false){const city='西安',cityId='610100',domain=source==='贝壳'?'ke.com':'anjuke.com',key=[domain,cityId,id].join('|');return {key,domain,source,city,cityId,sourceId:id,id:'H-XA-'+id,community,...communityIds(source,community),firstIngestTrigger:'platform_task',title:community+' '+room+'室 南北通透',price,room,area,bath:2,channel:'第三方',district:'浐灞国际港',block:'浐河西路',status:'上架',updatedAt:'2026-10-22 09:20:00',collectedAt:'2026-10-22 09:20:00',shortLink:'https://m.house365.com/house/H-XA-'+id,owner};}
  function seed(){const h1=house('贝壳','101140402577','御锦城',108,3,94.06),h2=house('安居客','S4624826410476559','保利心语花园',156,3,112),h3=house('贝壳','101139343423','金地湖城大境',218,4,136),h4=house('安居客','S8624826410476521','龙湖香醍国际',188,3,128);h4.otherOnly=true;return {version:2,masterCommunities:masterCommunitySeed(),brokers:{[OWNER]:{id:OWNER,name:'张经理',city:'西安'},'broker-demo-2':{id:'broker-demo-2',name:'李经理',city:'西安'}},houses:[h1,h2,h3,h4],relations:{[OWNER+'|'+h1.key]:{active:true,associatedAt:'2026-10-22 09:20:00',updatedAt:'2026-10-22 09:20:00',entry:'app'},[OWNER+'|'+h2.key]:{active:true,associatedAt:'2026-10-22 09:20:00',updatedAt:'2026-10-22 09:20:00',entry:'chat'},['broker-demo-2|'+h1.key]:{active:true,associatedAt:'2026-10-22 09:22:00',updatedAt:'2026-10-22 09:22:00',entry:'private'}},revisions:{},tasks:[],refreshes:[]};}
  function get(){try{const s=JSON.parse(localStorage.getItem(KEY))||seed();let changed=false;if(!s.masterCommunities){s.masterCommunities=masterCommunitySeed();changed=true;}for(const r of Object.values(s.relations)){if(Object.hasOwn(r,'recommended')){delete r.recommended;changed=true;}}for(const h of s.houses){if(!h.firstIngestTrigger){h.firstIngestTrigger='platform_task';changed=true;}const ids=communityIds(h.source,h.community);for(const k of ['sourceCommunityId','masterCommunityId'])if(!h[k]){h[k]=ids[k];changed=true;}}for(const t of s.tasks){if(t.admissionError){const message=t.admissionError.replace(/西安安家顾问/g,'安家顾问').replace('当前仅支持西安站点安家顾问上传。','您的账号暂未开通房源上传权限，请咨询客服。').replace('接口指定的西安城市客服','指定城市客服');if(t.items.length||t.admissionError!==message){t.items=[];t.sentKeys=[];t.admissionError=message;changed=true;}continue;}if(t.target)continue;let migrated=false;for(const i of t.items){if(i.status==='failed'&&i.failureCode==='already_in_my_houses'){i.status='ready';i.resultCode='already_in_my_houses';i.error='';delete i.failureCode;i.reusedRelation=true;i.collected=true;i.readyAt=t.finishedAt||t.time;migrated=changed=true;}}if(migrated&&t.status!=='cancelled'&&!active(t)){t.status=t.items.some(i=>i.status==='failed')?'partial':'completed';}}if(changed){s.version=3;localStorage.setItem(KEY,JSON.stringify(s));}return s;}catch{return seed()}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}listeners.forEach(f=>f(s));window.dispatchEvent(new CustomEvent('housing-demo-change',{detail:s}));return s;}
  if(!localStorage.getItem(KEY))save(seed());
  function parse(text){const urls=[...String(text).matchAll(/https?:\/\/[^\s<>"“”]+/g)].map(m=>({url:m[0].replace(/[，。；、！!）)\]】]+$/g,''),position:m.index}));const seen=new Map(),items=[];urls.forEach((v,i)=>{if(!/ke\.com|anjuke\.com/.test(v.url))return;let u,domain='',c='',id='',error='';try{u=new URL(v.url);const h=u.hostname.toLowerCase();let m;if(h==='m.ke.com'&&(m=u.pathname.match(/^\/([^/]+)\/ershoufang\/(\d+)\.html\/?$/))){domain='ke.com';c=m[1];id=m[2]}else if((m=h.match(/^([a-z]+)\.ke\.com$/))&&m[1]!=='m'){domain='ke.com';c=m[1];id=u.pathname.match(/^\/ershoufang\/(\d+)\.html\/?$/)?.[1]||''}else if(h==='m.anjuke.com'&&(m=u.pathname.match(/^\/([^/]+)\/sale\/([SA]\d+)\/?$/))){domain='anjuke.com';c=m[1];id=m[2]}else if((m=h.match(/^([a-z]+)\.anjuke\.com$/))&&m[1]!=='m'){domain='anjuke.com';c=m[1];id=u.pathname.match(/^\/prop\/view\/([SA]\d+)\/?$/)?.[1]||''}else error='不是本期支持的房源详情入口';}catch{error='链接不完整，请检查房源地址'}const city=cities[c];if(!error&&!city)error='无法识别链接城市';if(!error&&!id)error='未识别到房源ID，请提供完整详情链接';if(!error&&city.name!=='西安')error='当前仅开放西安站点';const key=domain&&city&&id?[domain,city.id,id].join('|'):'invalid-'+i;if(seen.has(key)&&!error){seen.get(key).duplicates++;return}const item={...v,key,domain,city:city?.name||'',cityId:city?.id||'',sourceId:id,source:domain==='ke.com'?'贝壳':'安居客',error,status:error?'failed':'waiting',duplicates:0};seen.set(key,item);items.push(item)});return items;}
  const relation=(s,key)=>s.relations[OWNER+'|'+key];
  const owns=(s,key)=>!!relation(s,key)?.active;
  // APP查询范围按真实来源判断；安居客仅本人列表已有可见，界面渠道仍统一为第三方。
  const allowed=(s,h)=>!!h&&((h.domain==='anjuke.com'||h.source==='安居客')?owns(s,h.key):(h.domain==='ke.com'||h.source==='贝壳'||h.erpAllowed||owns(s,h.key)));
  function uploadOrder(s,key){const r=relation(s,key);if(!r?.active)return {time:0,index:0};const task=s.tasks.find(t=>t.id===(r.lastUploadRequestId||r.requestId)),item=task?.items.find(i=>i.key===key);return {time:task?.created||Date.parse(String(r.lastUploadedAt||r.associatedAt||'').replace(' ','T')+'+08:00')||0,index:item?.index||0};}

  const active=t=>['processing','sending'].includes(t.status);
  const sameSubmitter=(t,entry,viewer)=>entry==='private'?t.entry==='private'&&t.recordViewer===(viewer||''):t.owner===OWNER;
  const sameDestination=(t,entry,target,session)=>t.entry===entry&&t.target===target&&(!target||t.session===session);
  function create(text,entry='app',target='',opt={}){
    const s=get(),session=opt.session||(entry==='private'?'wecom-xa':'lin');
    // 先校验上传准入，失败仅留原始消息；不解析链接、统计套数或创建逐套处理项。
    const admissionError=entry==='private'?(!opt.recordViewer||opt.registered===false?'仅支持已入驻平台的安家顾问上传，请先核对您的有客账号。':opt.brokerCity&&opt.brokerCity!=='西安'?'您的账号暂未开通房源上传权限，请咨询客服。':opt.serviceConfigured===false||opt.serviceCity&&opt.serviceCity!=='西安'?'请将房源链接发送给指定城市客服。':''):'';
    if(admissionError){const id='UP-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5);s.tasks.push({id,text,entry,target:'',recordViewer:opt.recordViewer||'',owner:opt.recordViewer||'',city:'西安',cityId:'610100',submitterName:s.brokers[opt.recordViewer]?.name||'身份未确认',created:Date.now(),time:stamp(),finishedAt:stamp(),status:'partial',admissionError,items:[],sentKeys:[],session});save(s);window.HousingDemo.lastCreate={reused:false,id};return id;}
    let items=opt.keys?opt.keys.map(key=>{const h=s.houses.find(x=>x.key===key);return {...h,url:h?.shortLink||'',status:h&&allowed(s,h)?'waiting':'failed',error:h&&allowed(s,h)?'':'没有使用该房源的权限',duplicates:0}}):parse(text);
    if(!items.length)return null;

    // 原消息与房源明细沿用现有记录；执行中的来源处理按识别键复用，不新建重复采集任务。
    const prior=s.tasks.filter(t=>active(t));
    const matches=items.map(i=>!i.error&&prior.find(t=>sameSubmitter(t,entry,opt.recordViewer)&&sameDestination(t,entry,target,session)&&t.items.some(j=>j.key===i.key&&!j.excluded&&j.status!=='failed'&&(!target||!['sent','reused'].includes(j.sendStatus)))));
    if(matches.every(Boolean)&&new Set(matches.map(t=>t.id)).size===1){const t=matches[0];t.duplicateSubmissions=(t.duplicateSubmissions||0)+1;(t.submissions||(t.submissions=[])).push({text,time:stamp()});save(s);window.HousingDemo.lastCreate={reused:true,id:t.id};return t.id;}
    const id='UP-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5);let injectedFailure=false;
    items=items.map((x,i)=>{const producer=!x.error&&prior.find(t=>t.items.some(j=>j.key===x.key&&!j.sharedTaskId&&!j.excluded&&j.status!=='failed'&&j.status!=='ready'));
      const pendingDelivery=matches[i];return {...x,index:i,revision:s.revisions[OWNER+'|'+x.key]||0,sharedTaskId:producer?.id||'',deliveryTaskId:pendingDelivery?.id||'',failOnce:!!(opt.failFirst&&!injectedFailure&&!s.houses.some(h=>h.key===x.key)&&(injectedFailure=true)),events:[{label:x.error?'识别未通过':'识别通过',time:stamp()}]};});
    const task={id,text,entry,target,recordViewer:opt.recordViewer||'',owner:entry==='private'?(opt.recordViewer||''):OWNER,city:'西安',cityId:'610100',submitterName:s.brokers[entry==='private'?opt.recordViewer:OWNER]?.name||'身份未确认',fromSelection:!!opt.keys,failSourceUpdate:!!opt.failSourceUpdate,failAssociation:!!opt.failAssociation,created:Date.now(),time:stamp(),status:'processing',items,sentKeys:[],session};
    s.tasks.push(task);save(s);window.HousingDemo.lastCreate={reused:false,id};return id;
  }
  function resultFor(item){return {...house(item.source,item.sourceId,item.source==='安居客'?'恒大绿洲':'御锦城',item.source==='安居客'?128:108,3,item.source==='安居客'?106.5:94.06),firstIngestTrigger:'link_upload'};}
  function finish(s,t,item,h,reused=false){
    item.houseId=h.id;item.shortLink=h.shortLink;item.collected=true;item.reusedHouse=reused;
    if(reused)item.events.push({label:'来源时效与可用性检查已完成',time:stamp()});
    item.events.push({label:'业务房源及平台卡片属性已就绪',time:stamp()});
    if(h.status==='下架'){item.status='failed';item.error='来源房源已失效，暂不可用';item.associationStatus='not_started';return;}
    if(t.entry==='private'&&!t.owner){item.status='failed';item.associationStatus='needs_identity';item.error='房源已收录，尚未确认您的有客账号，未完成上传';item.events.push({label:item.error,time:stamp()});return;}
    if(t.owner){const rk=t.owner+'|'+item.key;
      if((s.revisions[rk]||0)!==item.revision){item.status='failed';item.associationStatus='failed';item.error='房源已从我的房源删除，未继续原处理';return;}
      const old=s.relations[rk];
      if(t.failAssociation){item.status='failed';item.associationStatus='failed';item.error='房源已收录，暂未加入我的房源，请稍后重试';item.events.push({label:item.error,time:stamp()});return;}
      item.reusedRelation=!!old?.active;const now=stamp();
      s.relations[rk]=old?.active?old:{...old,active:true,associatedAt:now,updatedAt:now,cancelledAt:'',entry:t.entry==='private'?'private':t.target?'chat':'app',requestId:t.id};
      const r=s.relations[rk],previous=s.tasks.find(x=>x.id===(r.lastUploadRequestId||r.requestId));
      if(!item.deliveryTaskId&&(!t.fromSelection||!old?.active)&&(!previous||t.created>=previous.created)){r.lastUploadRequestId=t.id;r.lastUploadedAt=now;r.updatedAt=now;}
      item.associationStatus='associated';item.associatedAt=r.associatedAt;item.error='';delete item.resultCode;item.events.push({label:'本人房源关系已确认，本次上传成功',time:now});
    }
    item.status='ready';item.readyAt=stamp();item.events.push({label:t.target?'本套已就绪，等待发送':'本套收录并关联完成，可通知经纪人',time:stamp()});
  }
  function step(s,t,item,stage){if(item.status==='failed'||item.status==='ready')return;const labels=['识别通过','来源入库，立即启动业务房源生成及来源小区挂接','业务房源已形成，来源小区已完成同小区识别','主小区关系完成，已供下游消费'];const states=['identified','source','business','ready'];const previous=['waiting','identified','source','business'].indexOf(item.status);const target=Math.min(stage,3);if(target<=previous-1)return;const n=Math.min(previous,3);if(n<0)return;if(n===1&&item.failOnce){item.status='failed';item.error='采集暂时失败（演示异常），可重试';item.events.push({label:item.error,time:stamp()});return}item.status=states[n];if(n===1){item.sourceIngestedAt=stamp();}item.events.push({label:labels[n],time:stamp()});if(n>=1){item.houseId='H-XA-'+item.sourceId;}
    if(n===3){let h=s.houses.find(h=>h.key===item.key);if(!h){h=resultFor(item);h.collectedAt=item.sourceIngestedAt||stamp();h.updatedAt=stamp();h.relationUpdatedAt=h.updatedAt;s.houses.push(h)}h.sourceCheckedAtMs=Date.now();item.sourceCheck='collected';finish(s,t,item,h)}}
  function advance(){const s=get();let changed=false;
    for(const t of s.tasks){if(!active(t))continue;
      const item=t.items.find(i=>!i.excluded&&i.status!=='failed'&&(t.target?!['sent','reused'].includes(i.sendStatus):i.status!=='ready'));
      if(!item){t.status=t.items.some(i=>!i.excluded&&i.status==='failed')?'partial':t.target?'sent':'completed';t.finishedAt=stamp();changed=true;continue;}
      if(!item.startedAt){item.startedAt=Date.now();item.events.push({label:'开始串行处理本套房源',time:stamp()});changed=true;}
      if(item.deliveryTaskId){const original=s.tasks.find(x=>x.id===item.deliveryTaskId),ref=original?.items.find(x=>x.key===item.key);
        if(ref&&['sent','reused'].includes(ref.sendStatus)){const h=s.houses.find(h=>h.key===item.key);if(h)finish(s,t,item,h,true);item.sendStatus='reused';item.deliveryReused=true;item.sentAt=ref.sentAt;item.events.push({label:'原会话已发送，本次重复项不再发送',time:stamp()});changed=true;continue;}
        if(ref?.status==='failed'||original?.status==='cancelled'){item.status='failed';item.error='原处理中房源未完成，可重试该项';changed=true;continue;}
        // 复用原发送，不新增另一份投递；界面仍展示同一套阶段。
        if(ref){item.reusingPending=true;item.sharedStage=ref.status;changed=true;continue;}
      }
      if(item.status==='ready'&&t.target){
        if(!item.sendStarted){item.sendStarted=Date.now();item.sendStatus='sending';changed=true;}
        else if(Date.now()-item.sendStarted>500){const rk=OWNER+'|'+item.key;
          if(t.owner&&(!owns(s,item.key)||(s.revisions[rk]||0)!==item.revision)){item.status='failed';item.error='房源已从我的房源删除，未发送本套房源';}
          else if(t.failSend){item.status='failed';item.error='本套消息发送失败，可重试发送';item.sendStatus='failed';}
          else{item.sendStatus='sent';item.sentAt=stamp();item.sentAtMs=Date.now();if(!t.sentKeys.includes(item.key))t.sentKeys.push(item.key);item.events.push({label:'本套小程序房源已发送',time:item.sentAt});}changed=true;
        }continue;
      }
      const existing=s.houses.find(h=>h.key===item.key);
      if(item.sharedTaskId){const original=s.tasks.find(x=>x.id===item.sharedTaskId),ref=original?.items.find(x=>x.key===item.key);
        if(ref?.sourceCheck==='failed'||ref?.status==='failed'&&!ref.collected){item.status='failed';item.sourceCheck='failed';item.error='房源更新未完成，请稍后重试';changed=true;continue;}
        if(ref&&!ref.collected&&active(original)){item.reusingPending=true;item.sharedStage=ref.status;changed=true;continue;}
        item.sharedTaskId='';item.reusingPending=false;
      }
      if(item.status==='waiting'&&existing){
        if(existing.status==='下架'){finish(s,t,item,existing,true);changed=true;continue;}
        const fresh=existing.sourceCheckedAtMs&&Date.now()-existing.sourceCheckedAtMs<DEMO_FRESH_MS;
        if(!fresh){
          if(!item.sourceUpdateStarted){item.sourceUpdateStarted=Date.now();item.sourceCheck='updating';item.events.push({label:'检查来源信息并更新房源',time:stamp()});changed=true;continue;}
          if(Date.now()-item.sourceUpdateStarted<1100)continue;
          if(t.failSourceUpdate){item.status='failed';item.sourceCheck='failed';item.error='本次房源更新未完成，请稍后重试';item.events.push({label:item.error,time:stamp()});changed=true;continue;}
          existing.price+=1;existing.updatedAt=stamp();existing.lastRefresh=existing.updatedAt;existing.sourceCheckedAtMs=Date.now();item.sourceCheck='updated';
        }else item.sourceCheck='fresh';
        finish(s,t,item,existing,true);changed=true;continue;
      }
      const n=Math.floor((Date.now()-item.startedAt)/850);step(s,t,item,n);changed=true;
    }
    for(const r of s.refreshes){if(r.status!=='processing'||Date.now()-r.created<1600)continue;const h=s.houses.find(x=>x.key===r.key);r.status=r.fail?'failed':'completed';r.finishedAt=stamp();if(h&&!r.fail){h.price+=2;h.updatedAt=stamp();h.lastRefresh=r.finishedAt;h.sourceCheckedAtMs=Date.now()}changed=true;}
    if(changed)save(s);
  }
  function retry(id){const s=get(),t=s.tasks.find(t=>t.id===id);if(!t||t.admissionError||!t.items.some(i=>i.status==='failed'&&i.sourceId&&!i.excluded&&i.failureCode!=='already_in_my_houses'))return;t.failSend=false;t.failAssociation=false;t.failSourceUpdate=false;
    t.items.filter(i=>i.status==='failed'&&!i.excluded&&i.failureCode!=='already_in_my_houses').forEach(i=>{if(!i.sourceId)return;i.error='';i.status=i.sendStatus==='failed'?'ready':'waiting';i.sendStatus='';i.failOnce=false;i.sourceUpdateStarted=0;i.sourceCheck='';i.startedAt=0;i.sendStarted=0;i.sharedTaskId='';i.deliveryTaskId='';i.reusingPending=false;i.revision=s.revisions[OWNER+'|'+i.key]||0;i.events.push({label:'仅重试未完成步骤',time:stamp()})});
    delete t.finishedAt;t.status='processing';save(s);
  }
  function stages(t,i,audience='broker'){const invalid=!!i.error&&i.status==='failed',collected=!!i.collected||i.status==='ready',state=i.sharedStage||i.status,levels={waiting:0,identified:1,source:2,business:3,ready:4},n=levels[state]||0,ready=i.status==='ready',sent=['sent','reused'].includes(i.sendStatus);
    return [
      {label:'识别链接',state:invalid&&!i.sourceId?'failed':'done',text:invalid&&!i.sourceId?'链接需补正':'已识别'},
      {label:'收录房源',state:collected?'done':invalid?'failed':n>0||i.startedAt?'running':'waiting',text:collected?'已就绪':i.sourceCheck==='updating'?'更新中':i.reusingPending?'处理中':invalid?'处理失败':i.startedAt?'处理中':'等待前序房源'},
      ...((t.owner||t.entry==='private')?[{label:audience==='platform'?'关联经纪人':'加入我的房源',state:i.associationStatus==='associated'||ready?'done':i.associationStatus==='failed'?'failed':'waiting',text:i.associationStatus==='needs_identity'?'待确认经纪人身份':i.associationStatus==='failed'?(audience==='platform'?'关联未成功':'尚未加入我的房源'):ready?(audience==='platform'?'已关联':'已加入我的房源'):'待房源可用'}]:[]),
      ...(t.target?[{label:'转换卡片',state:ready?'done':'waiting',text:ready?'卡片已就绪':'待房源可用'},{label:'发送客户',state:sent?'done':i.sendStatus==='failed'?'failed':i.sendStatus==='sending'?'running':'waiting',text:sent?(i.deliveryReused?'原会话已发送':'已发送'):i.sendStatus==='failed'?'发送失败':i.sendStatus==='sending'?'发送中':'等待本套完成'}]:[])
    ];
  }
  function cancel(id){const s=get(),t=s.tasks.find(t=>t.id===id);if(t&&!['sent','completed'].includes(t.status)){t.status='cancelled';save(s)}}
  function unlink(key){const s=get(),r=relation(s,key);if(r){r.active=false;r.updatedAt=stamp();r.cancelledAt=r.updatedAt;}s.revisions[OWNER+'|'+key]=(s.revisions[OWNER+'|'+key]||0)+1;save(s)}
  function refresh(key,fail=false){const s=get();if(!owns(s,key))return null;const existing=s.refreshes.find(r=>r.key===key&&r.status==='processing');if(existing)return existing.id;const id='REF-'+Date.now().toString(36);s.refreshes.push({id,key,status:'processing',created:Date.now(),time:stamp(),fail});save(s);return id}
  
  const sub=f=>{listeners.add(f);return()=>listeners.delete(f)};
  window.addEventListener('storage',e=>{if(e.key===KEY)listeners.forEach(f=>f(get()))});
  window.HousingDemo={get,save,parse,create,retry,stages,cancel,unlink,refresh,owns,allowed,relation,uploadOrder,communityIds,searchMasterCommunities,subscribe:sub,sample,owner:OWNER,reset:()=>save(seed()),stamp,KEY};
  setInterval(advance,700);
})();
