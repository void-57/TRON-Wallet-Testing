function isHex64(str) {
  return /^[0-9a-fA-F]{64}$/.test(str);
}
function isWif(str) {
  return /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(str); // Bitcoin WIF regex
}

async function recoverTronAddressFromPrivKey(privKey) {
  const tronWeb = new TronWeb(
    "https://api.shasta.trongrid.io",
    "https://api.shasta.trongrid.io",
    "https://api.shasta.trongrid.io"
  );

  try {
    // Case 1: Tron raw hex priv key (64 chars)
    if (isHex64(privKey)) {
      const tronAddress = tronWeb.address.fromPrivateKey(privKey);
      return { source: "Tron Hex Private Key", tronAddress };
    }else{

    // Case 2: Bitcoin/FLO WIF
    
      const decoded = coinjs.wif2privkey(privKey); 
      console.log(decoded);

      if (!decoded || !decoded['privkey']) {
        return { error: "Invalid WIF private key" };
      }
      rawHexKey = decoded['privkey'];
      const tronAddress = tronWeb.address.fromPrivateKey(rawHexKey);
      return { source: "BTC/FLO WIF Private Key", tronAddress };
    }

    throw new Error("Unsupported private key format");
  } catch (err) {
    return { error: err.message };
  }
}

// UI Hook
async function runAddressRecovery() {
  const privKey = document.getElementById("recoveryPrivKey").value.trim();
  const output = document.getElementById("recoveryOutput");

  if (!privKey) {
    output.innerHTML = `<p style="color:red;">Enter a private key</p>`;
    return;
  }

  const recovered = await recoverTronAddressFromPrivKey(privKey);

  if (recovered.error) {
    output.innerHTML = `<p style="color:red;">${recovered.error}</p>`;
  } else {
    output.innerHTML = `
      <div class="tx-card">
        <p><b>Private Key:</b> ${privKey}
          <i class="fas fa-copy copy-inline" onclick="copyToClipboard('${privKey}')"></i>
        <p><b>Source:</b> ${recovered.source}</p>
        <p><b>Tron Address:</b> ${recovered.tronAddress}
          <i class="fas fa-copy copy-inline" onclick="copyToClipboard('${recovered.tronAddress}')"></i>
        </p>
      </div>
    `;
  }
}
