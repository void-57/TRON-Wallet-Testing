// sendTrx.js
const fullNode = "https://api.shasta.trongrid.io";
const solidityNode = "https://api.shasta.trongrid.io";
const eventServer = "https://api.shasta.trongrid.io";
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

async function sendTrx() {
  const fromAddress = document.getElementById("fromAddr").value.trim();
  let privateKey = document.getElementById("privKey").value.trim();
  const toAddress = document.getElementById("toAddr").value.trim();
  const amount = parseFloat(document.getElementById("amount").value) * 1e6;

  const outputDiv = document.getElementById("sendOutput");
  outputDiv.innerHTML = "⏳ Sending transaction...";

  try {
    // (WIF → hex if needed)
    if (/^[5KLc9RQ][1-9A-HJ-NP-Za-km-z]{50,}$/.test(privateKey)) {
      // Looks like WIF (BTC / FLO style)
      const decoded = coinjs.wif2privkey(privateKey);
      if (!decoded || !decoded.privkey) {
        throw new Error("Invalid WIF private key");
      }
      privateKey = decoded.privkey; // hex format now
    } else if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error("Private key must be Tron hex or valid WIF");
    }

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

    // Format result
    const status = receipt.result ? "✅ Success" : "❌ Failed";
    const statusColor = receipt.result ? "green" : "red";
    const txid = receipt.txid ? truncate(receipt.txid) : "N/A";

    outputDiv.innerHTML = `
      <div class="tx-card">
        <p><b>Status:</b> <span style="color:${statusColor}">${status}</span></p>
        <p><b>Transaction Hash:</b> ${txid}
          ${receipt.txid ? `<button onclick="copyToClipboard('${receipt.txid}')"><i class="fas fa-copy"></i></button>` : ""}</p>
        <p><b>From:</b> ${fromAddress}
          <button onclick="copyToClipboard('${fromAddress}')"><i class="fas fa-copy"></i></button></p>
        <p><b>To:</b> ${toAddress}
          <button onclick="copyToClipboard('${toAddress}')"><i class="fas fa-copy"></i></button></p>
        <p><b>Amount:</b> <span style="color:#0f0;font-weight:bold">${amount / 1e6} TRX</span></p>
      </div>
    `;
  } catch (err) {
    outputDiv.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
  }
}

// Helpers
function truncate(str, len = 12) {
  if (!str) return "";
  return str.length > len ? str.slice(0, 6) + "..." + str.slice(-6) : str;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied: " + text);
  });
}
