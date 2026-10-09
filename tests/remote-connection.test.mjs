import test from 'node:test';
import assert from 'node:assert/strict';
import {limitStream, summarizeConnection} from '../app/remote-connection.ts';
import {connectionServers} from '../app/api/rtc/ice-servers.ts';

test('Data saver limits video size, rate and bandwidth while retaining audio', async () => {
  const applied=[];
  const sender=kind=>({track:{kind,getSettings:()=>({width:1280})},getParameters:()=>({encodings:[{}],transactionId:'existing'}),setParameters:async parameters=>applied.push({kind,parameters})});
  await limitStream({getSenders:()=>[sender('video'),sender('audio')]},'saver');
  assert.equal(applied[0].parameters.transactionId,'existing');
  assert.equal(applied[0].parameters.encodings[0].maxBitrate,600000);
  assert.equal(applied[0].parameters.encodings[0].maxFramerate,24);
  assert.ok(1280/applied[0].parameters.encodings[0].scaleResolutionDownBy<=480);
  assert.equal(applied[1].parameters.encodings[0].maxBitrate,64000);
  assert.equal(applied[1].parameters.encodings[0].maxFramerate,undefined);
});

test('Connection report uses selected candidate pair and interval packet loss', () => {
  const rows=[{id:'transport',type:'transport',selectedCandidatePairId:'pair'},{id:'pair',type:'candidate-pair',localCandidateId:'local',remoteCandidateId:'remote',currentRoundTripTime:.125},{id:'local',type:'local-candidate',candidateType:'host'},{id:'remote',type:'remote-candidate',candidateType:'relay'},{id:'video',type:'inbound-rtp',kind:'video',timestamp:3000,bytesReceived:200000,packetsLost:12,packetsReceived:180,framesPerSecond:24,jitter:.045}];
  const report=new Map(rows.map(row=>[row.id,row]));
  const {sample}=summarizeConnection(report,true,{timestamp:1000,bytes:100000,lost:2,received:90});
  assert.deepEqual(sample,{route:'relay',rtt:125,fps:24,bitrate:400,loss:10,jitter:45,limitation:null});
  assert.equal(summarizeConnection(report,true).sample.loss,null);
});

test('STUN-only configuration accurately reports no relay', async () => {
  const result=await connectionServers({});
  assert.equal(result.relay,false);
  assert.equal(result.iceServers.length,1);
});

test('Cloudflare permanent key is exchanged only for short-lived credentials', async () => {
  const result=await connectionServers({CLOUDFLARE_TURN_KEY_ID:'test-key',CLOUDFLARE_TURN_API_TOKEN:'server-only-test-secret'},async(url,options)=>{
    assert.ok(url.endsWith('/test-key/credentials/generate-ice-servers'));
    assert.equal(options.headers.Authorization,'Bearer server-only-test-secret');
    assert.equal(JSON.parse(options.body).ttl,14400);
    return Response.json({iceServers:[{urls:['turn:turn.cloudflare.com:53','turns:turn.cloudflare.com:443?transport=tcp'],username:'temporary-user',credential:'temporary-secret'}]},{status:201});
  });
  assert.equal(result.relay,true);
  assert.deepEqual(result.iceServers[1].urls,['turns:turn.cloudflare.com:443?transport=tcp']);
  assert.ok(!JSON.stringify(result).includes('server-only-test-secret'));
});

test('Provider failure falls back honestly and can use another configured relay', async () => {
  const env={CLOUDFLARE_TURN_KEY_ID:'test',CLOUDFLARE_TURN_API_TOKEN:'test'};
  const fail=async()=>new Response('',{status:503});
  const direct=await connectionServers(env,fail);
  assert.equal(direct.relay,false);assert.ok(direct.warning);
  const fallback=await connectionServers({...env,TURN_URL:' turn:example.com:3478 ',TURN_USERNAME:'test',TURN_CREDENTIAL:'test'},fail);
  assert.equal(fallback.relay,true);assert.equal(fallback.warning,'');
});

test('Malformed relay response never marks STUN as a usable relay', async () => {
  const result=await connectionServers({CLOUDFLARE_TURN_KEY_ID:'test',CLOUDFLARE_TURN_API_TOKEN:'test'},async()=>Response.json({iceServers:[{urls:['stun:example.com']}] }));
  assert.equal(result.relay,false);assert.ok(result.warning);
});
