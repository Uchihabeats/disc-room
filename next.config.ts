import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
 poweredByHeader: false,
 webpack(config) {
  config.module.rules.push({test:/\.html$/,resourceQuery:/raw/,type:'asset/source'});
  return config;
 },
 async headers() {
  return [{source:'/media/:path*',headers:[
   {key:'Cache-Control',value:'public, max-age=31536000, immutable'},
  ]},{source:'/:path*',headers:[
   {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
   {key:'Cross-Origin-Embedder-Policy',value:'require-corp'},
   {key:'Cross-Origin-Resource-Policy',value:'same-origin'},
  ]}];
 },
};
export default nextConfig;
