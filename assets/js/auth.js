;(function (root, factory) {
  const api = factory();
  root.VL = Object.assign(root.VL || {}, { auth: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Soft gate only (not real security): see spec section 8.
  // Set this to the SHA-256 hex of your chosen passphrase (see step below). Generate with:
  //   node -e "console.log(require('crypto').createHash('sha256').update('YOUR-PASSPHRASE').digest('hex'))"
  // Placeholder below MUST be replaced before the admin is used in production.
  let PASSPHRASE_HASH = 'c9455cae8d0a6de589e42692371d8411bdbc8edb3f5cd9950f8cb25b5d483489';
  const SESSION_KEY = 'vl_admin_unlocked';

  // UTF-8 byte array for a string.
  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(String(str)));
    var s = unescape(encodeURIComponent(String(str))), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff);
    return out;
  }

  // Pure-JS SHA-256 (no WebCrypto). Works in ANY context, including file:// pages
  // where crypto.subtle is unavailable. This is what lets the admin work by
  // double-clicking the file (no server, no secure context required).
  function sha256PureHex(str) {
    function ror(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes = utf8Bytes(str);
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    bytes.push((hi>>>24)&0xff,(hi>>>16)&0xff,(hi>>>8)&0xff,hi&0xff);
    bytes.push((lo>>>24)&0xff,(lo>>>16)&0xff,(lo>>>8)&0xff,lo&0xff);
    var w = new Array(64);
    for (var off = 0; off < bytes.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        w[t] = ((bytes[off+t*4]<<24) | (bytes[off+t*4+1]<<16) | (bytes[off+t*4+2]<<8) | (bytes[off+t*4+3])) | 0;
      }
      for (var t = 16; t < 64; t++) {
        var s0 = ror(w[t-15],7) ^ ror(w[t-15],18) ^ (w[t-15]>>>3);
        var s1 = ror(w[t-2],17) ^ ror(w[t-2],19) ^ (w[t-2]>>>10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t = 0; t < 64; t++) {
        var S1 = ror(e,6) ^ ror(e,11) ^ ror(e,25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = ror(a,2) ^ ror(a,13) ^ ror(a,22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    var hex = '';
    for (var i = 0; i < 8; i++) hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }

  // Use native WebCrypto when available (secure contexts), else the pure fallback.
  async function sha256Hex(str) {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
        var buf = await crypto.subtle.digest('SHA-256', new Uint8Array(utf8Bytes(str)));
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
    } catch (e) { /* fall through to pure implementation */ }
    return sha256PureHex(str);
  }

  async function verifyPassphrase(input) {
    return (await sha256Hex(String(input).trim())) === PASSPHRASE_HASH;
  }

  function setHashForTest(hash) { PASSPHRASE_HASH = hash; }

  function unlock() { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {} }
  function lock() { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {} }
  function isUnlocked() { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } }

  return { sha256Hex, sha256PureHex, verifyPassphrase, setHashForTest, unlock, lock, isUnlocked };
});
