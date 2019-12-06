# dexictl
Dexi.io command line utility

## Installation

**Prerequisites**
1. NodeJS version 9+
1. NPM

**Steps**

1. Run ```npm install -g dexictl```
1. Ensure npm global bins are on your environment PATH ( [Read more...](https://stackoverflow.com/questions/9679932/how-to-use-package-installed-locally-in-node-modules) ) 
1. Configure your account by running ```dexictl``` 

## Configuration

**Command** ```dexictl config```

Helps you configure the local utility. This will run automatically the first time you run this.

It will ask you for 4 values that you need to get from your dexi.io account: 

### Account id
Go to your account settings page and copy the ID from the URL - it'll look something like this: 

https://app.dexi.io/#/accounts/1234ABCD-1234-1234-1234-1234567ABCDE/settings

**1234ABCD-1234-1234-1234-1234567ABCDE** is the account id

### User id
Go to your user settings page and copy the ID from the URL - it'll look something like this: 

https://app.dexi.io/#/users/1234ABCD-1234-1234-1234-1234567ABCDE

**1234ABCD-1234-1234-1234-1234567ABCDE** is your user id

### API key
Go to your account settings and choose the API Keys tab - and create a new API key. Remember to save keys after adding it.

Copy the key from the input field to the dexictl utility.

You can also reuse an existing key.

### Dexi URL
This tells the utility where to connect to dexi - simply accept the default value which is https://api.dexi.io

## Develop

**Command** ```dexictl develop <port>```

Starts the developer connection to dexi for the dexi.yml file in the current working director and running in the port specified on the command line. 

For example if your app runs locally on port ```6500``` do ```dexictl develop 6500```


