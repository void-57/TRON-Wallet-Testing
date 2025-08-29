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
      return { source: "Tron", tronAddress };
    } else {
      // Case 2: Bitcoin/FLO WIF

      const decoded = coinjs.wif2privkey(privKey);
      console.log(decoded);

      if (!decoded || !decoded["privkey"]) {
        return { error: "Invalid WIF private key" };
      }
      rawHexKey = decoded["privkey"];
      const tronAddress = tronWeb.address.fromPrivateKey(rawHexKey);
      return { source: "BTC/FLO", tronAddress };
    }

    throw new Error("Unsupported private key format");
  } catch (err) {
    return { error: err.message };
  }
}


async function runAddressRecovery() {
  const privKey = document.getElementById("recoveryPrivKey").value.trim();
  const output = document.getElementById("recoveryOutput");

  if (!privKey) {
    output.innerHTML = `<div class="error-state"><i class="fas fa-triangle-exclamation"></i>Enter a private key</div>`;
    if (typeof notify === "function") notify("Enter a private key", "error");
    return;
  }

  // Set loading state
  if (typeof setButtonLoading === "function") {
    setButtonLoading("recoverBtn", true);
  }

  const recovered = await recoverTronAddressFromPrivKey(privKey);

  if (recovered.error) {
    output.innerHTML = `<div class="error-state"><i class="fas fa-triangle-exclamation"></i>${recovered.error}</div>`;
    if (typeof notify === "function") notify(recovered.error, "error");
  } else {
    output.innerHTML = `
      <div class="address-recovered-success">
        <div class="success-header">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Address Recovered Successfully!</h3>
          <p>The TRON address has been recovered from the provided private key.</p>
        </div>
      </div>

      <div class="blockchain-section">
        <div class="blockchain-header">
          <h4><i class="fas fa-key"></i> Private Key Used</h4>
          <div class="blockchain-badge primary">${recovered.source}</div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-key"></i> Private Key</label>
          <div class="value-container">
            <code>${privKey}</code>
            <button class="btn-icon" onclick="navigator.clipboard.writeText('${privKey}').then(()=>notify && notify('Private key copied','success'))" title="Copy Private Key">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="blockchain-section">
        <div class="blockchain-header">
          <h4><i class="fas fa-map-marker-alt"></i> Recovered Address</h4>
          <div class="blockchain-badge secondary">TRON</div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-map-marker-alt"></i> TRON Address</label>
          <div class="value-container">
            <code>${recovered.tronAddress}</code>
            <button class="btn-icon" onclick="navigator.clipboard.writeText('${recovered.tronAddress}').then(()=>notify && notify('TRON address copied','success'))" title="Copy TRON Address">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="wallet-security-notice">
        <div class="notice-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="notice-content">
          <h4>Security Reminder</h4>
          <p>Keep your private key safe and secure. Never share it with anyone. Consider backing it up in a secure location.</p>
        </div>
      </div>
    `;
    if (typeof notify === "function") notify("Address recovered", "success");
  }

  // Clear loading state
  if (typeof setButtonLoading === "function") {
    setButtonLoading("recoverBtn", false);
  }
}
