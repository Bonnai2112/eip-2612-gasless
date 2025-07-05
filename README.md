# Documentation EIP-2612 Implementation

## Vue d'ensemble

Ce projet démontre l'implémentation du standard EIP-2612, qui permet aux utilisateurs d'autoriser des dépenses de tokens ERC-20 sans nécessiter de transaction préalable d'approbation. Cette fonctionnalité améliore l'expérience utilisateur en réduisant le nombre de transactions et les coûts de gas.

## Architecture

### Composants principaux

- **Provider**: Connexion à un nœud Ethereum local (Anvil)
- **Wallets**: 
  - `wallet`: Le propriétaire des tokens
  - `walletRelayer`: Le relayer qui effectue les transactions
- **Token**: Contrat USDC avec support EIP-2612
- **Nostro**: Adresse de destination pour les transferts

### Adresses utilisées

```javascript
const whale = "0x55fe002aeff02f77364de339a1292923a15844b8";
const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const nostroAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
```

## Fonctionnalités implémentées

### 1. Interface du Token

Le contrat token expose les fonctions suivantes :

```javascript
const tokenInstance = new Contract(tokenAddress, [
  "function name() view returns (string)",
  "function nonces(address) view returns (uint256)",
  "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
  "function transferFrom(address src, address dst, uint256 wad) returns (bool)",
  "function transfer(address dst, uint256 wad) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
], walletRelayer);
```

### 2. Signature EIP-712

Le système utilise EIP-712 pour créer des signatures typées sécurisées :

```javascript
const domain = {
  name: "USD Coin",
  version: "2",
  chainId: 1,
  verifyingContract: tokenAddress,
};

const types = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};
```

### 3. Workflow EIP-2612

1. **Génération du nonce** : Récupération du nonce actuel du propriétaire
2. **Création de la signature** : Signature off-chain des données de permission
3. **Exécution on-chain** : Le relayer appelle `permit()` puis `transferFrom()`

## Utilisation

### Prérequis

1. **Node.js** avec support des modules ES
2. **Ethers.js** v6+
3. **Nœud Ethereum local** (Anvil recommandé)

### Installation

```bash
npm install ethers
```

### Configuration

1. Démarrer Anvil :
```bash
anvil
```

2. Configurer les clés privées dans le script :
```javascript
const wallet = new Wallet("VOTRE_CLE_PRIVEE", provider);
const walletRelayer = new Wallet("CLE_RELAYER", provider);
```

### Exécution

```bash
node index.js
```

## Workflow détaillé

### Étape 1: Initialisation
- Connexion au provider local
- Configuration des wallets
- Initialisation du contrat token

### Étape 2: Affichage des soldes initiaux
```javascript
console.log("===> Balances before");
console.log("wallet eth balance => ", formatUnits(await provider.getBalance(wallet), 18));
console.log("relayer eth balance => ", formatUnits(await provider.getBalance(walletRelayer), 18));
console.log("wallet usdc balance => ", formatUnits(await tokenInstance.balanceOf(wallet), 6));
console.log("relayer usdc balance => ", formatUnits(await tokenInstance.balanceOf(walletRelayer), 6));
```

### Étape 3: Préparation des données de permission
```javascript
const value = parseUnits("100", 6); // 100 USDC
const nonce = await tokenInstance.nonces(wallet.address);
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 heure
```

### Étape 4: Signature EIP-712
```javascript
const signature = await wallet.signTypedData(domain, types, {
  owner: wallet.address,
  spender: walletRelayer.address,
  value,
  nonce,
  deadline,
});
```

### Étape 5: Exécution on-chain
```javascript
const { v, r, s } = Signature.from(signature);
await tokenInstance.permit(wallet.address, walletRelayer, value, deadline, v, r, s);
await tokenInstance.transferFrom(wallet.address, nostroAddress, value);
```

## Avantages EIP-2612

1. **Réduction des coûts** : Élimine la transaction d'approbation
2. **Meilleure UX** : Une seule signature au lieu de deux transactions
3. **Sécurité** : Utilise EIP-712 pour des signatures typées
4. **Deadline** : Contrôle temporel des permissions

## Sécurité

### Points d'attention

- **Deadline** : Vérifier que la signature n'a pas expiré
- **Nonce** : Chaque signature doit utiliser un nonce unique
- **Replay attacks** : Le nonce empêche les attaques de replay
- **Domain separator** : Assure l'unicité des signatures

### Bonnes pratiques

1. Toujours vérifier la deadline avant d'exécuter `permit()`
2. Utiliser des nonces séquentiels
3. Valider les adresses avant signature
4. Tester avec des montants faibles en premier

## Dépannage

### Erreurs communes

1. **"Invalid signature"** : Vérifier le domain separator et les types
2. **"Expired deadline"** : Augmenter la deadline ou re-signer
3. **"Invalid nonce"** : Récupérer le nonce actuel
4. **"Insufficient balance"** : Vérifier les soldes avant transfert

### Debug

Ajouter des logs pour déboguer :
```javascript
console.log("Nonce:", nonce);
console.log("Deadline:", deadline);
console.log("Signature:", signature);
```

## Extensions possibles

1. **Batch permits** : Permissions multiples en une transaction
2. **Meta-transactions** : Relayer les transactions pour les utilisateurs
3. **Gasless approvals** : Approbations sans gas pour l'utilisateur
4. **Multi-sig support** : Support des signatures multiples

Cette implémentation fournit une base solide pour comprendre et utiliser EIP-2612 dans vos applications DeFi.


## Scenarios

> scenario before 
wallet eth balance =>  0.0
relayer eth balance =>  10000.0
wallet usdc balance =>  3000.0
relayer usdc balance =>  0.0
recipent usdc balance =>  0.0

> scenario after
wallet eth balance =>  0.0
relayer eth balance =>  9999.999771728449529364
wallet usdc balance =>  2900.0
relayer usdc balance =>  0.0
recipent usdc balance =>  100.0

# Launch anvil 
anvil --fork-url https://ethereum-rpc.publicnode.com --fork-block-number 22847371 --block-time 10