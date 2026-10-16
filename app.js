const contractAddress = "0xEFCAFB64d86b0b0Bc5d67096B03D4C69278C55Cb";

let provider;
let signer;
let contract;

// 1. Automatically check if already connected when the page loads/refreshes
window.addEventListener("load", async () => {
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0) {
                await initializeWallet(accounts[0]);
            }
        } catch (error) {
            console.error("Error checking initial connection:", error);
        }
    }
});

// Helper function to set up provider, signer, contract, and balance
async function initializeWallet(userAddress) {
    provider = new ethers.BrowserProvider(window.ethereum);

    // Explicitly pass the active userAddress so Ethers uses the correct account
    signer = await provider.getSigner(userAddress);
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Fetch and display live blockchain data
    const tokenName = await contract.name();
    const tokenSymbol = await contract.symbol();
    const totalSupplyWei = await contract.totalSupply();
    const formattedTotalSupply = ethers.formatUnits(totalSupplyWei, 18);

    // Update your HTML elements
    document.getElementById('tokenName').innerText = tokenName;
    document.getElementById('tokenSymbol').innerText = tokenSymbol;
    document.getElementById('totalSupply').innerText = formattedTotalSupply;

    document.getElementById("walletAddress").innerText = "Wallet: " + userAddress.substring(0, 6) + "..." + userAddress.substring(38);
    updateBalance(userAddress);
}

// 2. Connect Button Handler
document.getElementById("connectWallet").addEventListener("click", async () => {
    if (typeof window.ethereum !== "undefined") {
        try {
            // Optional: Force switch to Sepolia network
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    alert("Please add Sepolia network to your MetaMask.");
                }
            }

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            await initializeWallet(accounts[0]);
        } catch (error) {
            console.error("User denied account access:", error);
        }
    } else {
        alert("Please install MetaMask to use this DApp!");
    }
});

// 3. Update Balance Function
async function updateBalance(addressOverride = null) {
    try {
        let userAddress = addressOverride;
        if (!userAddress) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return;
            userAddress = accounts[0];
        }

        const balanceWei = await contract.balanceOf(userAddress);
        const balanceFormatted = ethers.formatUnits(balanceWei, 18);
        document.getElementById("tokenBalance").innerText = "VTX Balance: " + balanceFormatted;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

// 4. Send Tokens Handler
document.getElementById("sendTokens").addEventListener("click", async () => {
    const recipient = document.getElementById("recipientAddress").value;
    const amount = document.getElementById("transferAmount").value;

    if (!recipient || !amount) {
        alert("Please fill in all fields.");
        return;
    }

    if (!contract) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        const amountWei = ethers.parseUnits(amount, 18);
        const tx = await contract.transfer(recipient, amountWei);
        alert("Transaction sent! Waiting for confirmation...");

        await tx.wait();
        alert("Transfer successful!");

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        updateBalance(accounts[0]);
    } catch (error) {
        console.error("Transfer failed:", error);
        alert("Transaction failed! Check console for details.");
    }
});

// 5. Listen for Account Swaps in MetaMask (Always active now)
if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
            // Force re-request or grab the newly selected account
            const currentAccounts = await window.ethereum.request({ method: "eth_accounts" });
            if (currentAccounts.length > 0) {
                await initializeWallet(currentAccounts[0]);
            }
        } else {
            document.getElementById("walletAddress").innerText = "Wallet: Not Connected";
            document.getElementById("tokenBalance").innerText = "VTX Balance: 0";
            contract = null;
        }
    });
}
// 6. minting new tokens
document.getElementById('mintBtn').addEventListener('click', async () => {
    if (!contract) {
        alert("Please connect your wallet first!");
        return;
    }

    const recipient = document.getElementById('mintRecipient').value;
    const amount = document.getElementById('mintAmount').value;

    if (!recipient || !amount) {
        alert("Please enter both a recipient address and an amount.");
        return;
    }

    try {
        console.log(`Minting ${amount} VTX to ${recipient}...`);

        // Call the smart contract mint function
        // Note: Your contract's mint function already handles the 10**18 decimal multiplication inside Solidity!
        const tx = await contract.mint(recipient, amount);

        console.log("Transaction sent:", tx.hash);
        alert("Mint transaction submitted! Waiting for confirmation...");

        // Wait for the blockchain to mine the transaction
        await tx.wait();
        updateBalance();

        alert("Tokens successfully minted!");

        // Clear inputs and refresh balances if you have a balance fetcher function
        document.getElementById('mintRecipient').value = '';
        document.getElementById('mintAmount').value = '';

    } catch (error) {
        console.error("Mint failed:", error);
        // This will catch the "Error: Unauthorized! Only the owner can run this." if run by a non-owner
        alert("Mint failed: " + (error.reason || error.message));
    }
});