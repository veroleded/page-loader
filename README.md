### Maintainability and test coverage
[![Maintainability](https://api.codeclimate.com/v1/badges/e8843fa2205e40d81b22/maintainability)](https://codeclimate.com/github/veroleded/fullstack-javascript-project-4/maintainability)

[![Test Coverage](https://api.codeclimate.com/v1/badges/e8843fa2205e40d81b22/test_coverage)](https://codeclimate.com/github/veroleded/fullstack-javascript-project-4/test_coverage)


# PageLoader

## Description
PageLoader is a command line utility that downloads pages from the internet and stores them on your computer. Along with the page it downloads all the resources (images, styles and js) allowing you to open the page without the Internet. The utility downloads resources in parallel and shows the progress of each resource in the terminal

## Download
```bash
git clone git@github.com:veroleded/page-loader.git
```

### Install
```bash
make install
```
### To globally install a package from a local directory, use the command:
```bash
make setup
```

### Get more information about the program
```bash
page-loader -h
```

### Run program
```bash
page-loader url
```
### Test
```bash
make test
```
``` bash
make test-debug
```
``` bash
make test-coverage
```
