## Installation ```Linux``` or ```MacOS```

* `Chrome` & `NodeJS` installed with latest version

## Usage

### Install dependent packages

```bash
yarn install
```

### Checking & Remove expired coupons

```bash
node index.amazon.checker.js
```

### Crawler

```bash
ADMIN_USER=(ADMIN_USER) ADMIN_PASS=(ADMIN_PASS) CATEGORY=(pet-supplies/kitchen/etc) OS=(macos/linux) node index.amazon.js
```

### Insert

```bash
ADMIN_USER=(ADMIN_USER) ADMIN_PASS=(ADMIN_PASS) OS=(macos/linux) node index.amazon.inserter.js
```