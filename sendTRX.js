const fullNode = "https://api.shasta.trongrid.io";
const solidityNode = "https://api.shasta.trongrid.io";
const eventServer = "https://api.shasta.trongrid.io";
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

async function sendTrx() {
  let privateKey = document.getElementById("privKey").value.trim();
  const toAddress = document.getElementById("toAddr").value.trim();
  const amount = parseFloat(document.getElementById("amount").value) * 1e6;

  const outputDiv = document.getElementById("sendOutput");
  outputDiv.innerHTML = "⏳ Sending transaction...";

  try {
    // Derive fromAddress from private key
    let fromAddress;
    let source = "Tron";

    // (WIF → hex if needed)
    if (/^[5KLc9RQ][1-9A-HJ-NP-Za-km-z]{50,}$/.test(privateKey)) {
      // Looks like WIF (BTC / FLO style)
      const decoded = coinjs.wif2privkey(privateKey);
      if (!decoded || !decoded.privkey) {
        throw new Error("Invalid WIF private key");
      }
      privateKey = decoded.privkey; // hex format now
      source = "BTC/FLO";
    } else if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error("Private key must be Tron hex or valid WIF");
    }

    // Derive Tron address from private key
    fromAddress = tronWeb.address.fromPrivateKey(privateKey);

    // Build transaction
    const tradeobj = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      amount,
      fromAddress
    );

    // Sign transaction
    const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);

    // Broadcast transaction
    const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);

    
    const status = receipt.result ? "✅ Success" : "❌ Failed";
    const statusColor = receipt.result ? "green" : "red";
    const txid = receipt.txid ? truncate(receipt.txid) : "N/A";

    outputDiv.innerHTML = `
      <div class="transaction-success">
        <div class="success-header">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Transaction Sent Successfully!</h3>
          <p>Your TRX transaction has been broadcasted to the network.</p>
        </div>
      </div>

      <div class="blockchain-section">
        <div class="blockchain-header">
          <h4><i class="fas fa-key"></i> Private Key Used</h4>
          <div class="blockchain-badge primary">${source}</div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-key"></i> Private Key</label>
          <div class="value-container">
            <code>${document.getElementById("privKey").value.trim()}</code>
            <button class="btn-icon" onclick="navigator.clipboard.writeText('${document
              .getElementById("privKey")
              .value.trim()}').then(()=>notify && notify('Private key copied','success'))" title="Copy Private Key">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="blockchain-section">
        <div class="blockchain-header">
          <h4><i class="fas fa-exchange-alt"></i> Transaction Details</h4>
          <div class="blockchain-badge secondary">TRON</div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-map-marker-alt"></i> From Address</label>
          <div class="value-container">
            <code>${fromAddress}</code>
            <button class="btn-icon" onclick="navigator.clipboard.writeText('${fromAddress}').then(()=>notify && notify('From address copied','success'))" title="Copy From Address">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-map-marker-alt"></i> To Address</label>
          <div class="value-container">
            <code>${toAddress}</code>
            <button class="btn-icon" onclick="navigator.clipboard.writeText('${toAddress}').then(()=>notify && notify('To address copied','success'))" title="Copy To Address">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-coins"></i> Amount</label>
          <div class="value-container">
            <code style="color: #10b981; font-weight: bold;">${
              amount / 1e6
            } TRX</code>
          </div>
        </div>
        <div class="detail-row">
          <label><i class="fas fa-hashtag"></i> Transaction Hash</label>
          <div class="value-container">
            <code>${txid}</code>
            ${
              receipt.txid
                ? `<button class="btn-icon" onclick="navigator.clipboard.writeText('${receipt.txid}').then(()=>notify && notify('Transaction hash copied','success'))" title="Copy Transaction Hash">
                    <i class="fas fa-copy"></i>
                   </button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
    return receipt;
  } catch (err) {
    outputDiv.innerHTML = `<div class="error-state"><i class="fas fa-triangle-exclamation"></i>Error: ${err.message}</div>`;
    throw err;
  }
}

function truncate(str, len = 12) {
  if (!str) return "";
  return str.length > len ? str.slice(0, 6) + "..." + str.slice(-6) : str;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied: " + text);
  });
}
