# The development version of the Vit Portal

```
npm install
npm run start
```

To use the development blockchain, tweak these settings:

```
diff --git a/src/index.js b/src/index.js
index 4f070ea..a397a3d 100644
--- a/src/index.js
+++ b/src/index.js
@@ -41,9 +41,9 @@ import Transfers from './Transfers';
 // Connect to Vit Testnet

 steem.api.setOptions({
-    url: 'https://peer.vit.tube/',
-    address_prefix: "VIT",
-    chain_id: "73f14dd4b7b07a8663be9d84300de0f65ef2ee7e27aae32bbe911c548c08f000"
+    url: 'https://peer.proto.vit.tube/',
+    address_prefix: "WIT",
+    chain_id: "1d50f6bcf387a5af6ebac42146ef920aedb5cc61d8f8ed37fb1ac671d722a302"
 });

 /*
 ```
