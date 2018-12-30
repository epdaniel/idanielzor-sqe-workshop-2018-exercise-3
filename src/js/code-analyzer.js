import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let nodes;
let passes;
let counter;
let inputVector;
let savedVars;
let nodesToConnect;
let greenNodes;

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const parseAndGenerateStringOfSVG = (codeToParse, vectorToParse) => {
    let parsed = esprima.parseScript(codeToParse);
    inputVector = JSON.parse(vectorToParse);
    makeParams(inputVector);
    savedVars = copyMap(inputVector);
    counter = 1;
    nodes = 'st=>start: Start\n';
    passes =  '';
    nodesToConnect = ['st'];
    greenNodes = [];
    getStringOfSVG(parsed, 1);
    makeNodesGreen();
    return nodes + passes;
};

const getStringOfSVG = (parsed, isGreen) => {
    let handler = typeHandlers.get(parsed.type);
    return handler ? handler.call(undefined, parsed, isGreen) : null;
};

//------------------ Help Functions ---------------------

const getNodeNumber = () =>{
    let str = '#' + counter + ':\n';
    counter++;
    return str;
};

const makeParams = (map) => {
    Object.keys(map).forEach(function(key) {
        let p = esprima.parseScript('' + map[key]);
        let str = JSON.stringify(p.body[0].expression);
        map[key] = JSON.parse(str);
    });
};

const copyMap = (oldMap) =>{
    let newMap = new Map();
    Object.keys(oldMap).forEach(function(key) {
        newMap[key] = JSON.parse(JSON.stringify(oldMap[key]));
    });
    return newMap;
};

//-------------- Node Help Functions --------------------

const createNewNode = (type, isGreen) => {
    let nodeName = 'node' + counter;
    connectNodesNeeded(nodeName);
    nodesToConnect = [];
    if(isGreen)
        greenNodes.push(nodeName);
    nodes += nodeName + '=>' + type + ': ' + getNodeNumber();
    return nodeName;
};

const makeNodesGreen = () => {
    greenNodes.forEach((greenNode)=>{
        let loc = nodes.search(greenNode);
        let nextNode = nodes.indexOf('node', loc+1);
        let firstHalf = nodes.slice(0, nextNode);
        let secondHalf = nodes.slice(nextNode);
        firstHalf = firstHalf.trim(0, -1);
        firstHalf += '|green\n';
        nodes = firstHalf.concat(secondHalf);
    });
};

const connectNodesNeeded = (toNode) =>{
    nodesToConnect.forEach((node) => {
        passes += node + '->' + toNode + '\n';
    });
};

//--------------------- Handlers ------------------------

const handleProgram = (json, isGreen) =>{
    json.body.forEach((exp) => {
        getStringOfSVG(exp, isGreen);
    });

};

const handleVarDec = (json) => {
    nodes += escodegen.generate(json) + '\n';
    json.declarations.forEach((dec) => {
        if(dec.init != null){
            savedVars[dec.id.name] = handleExp(dec.init);
        }
    });
};

const handleBlock = (json, isGreen) => {
    let nodeName = createNewNode('operation', isGreen);
    nodesToConnect.push(nodeName);
    json.body.forEach((exp) => { getStringOfSVG(exp, isGreen); });
    return [nodeName];
};

//returns true if left side of ass is param, false if local
const handleAssExp = (json) => {
    if(json.left.type === 'MemberExpression') {
        return memberAssign(json);
    }else{
        let val = handleExp(json.right);
        savedVars[json.left.name] = handleExp(val);
        nodes += escodegen.generate(json) + '\n';
    }
};

const memberAssign = (json) =>{
    let arr = savedVars[json.left.object.name];
    let val = handleExp(json.right);
    let index = handleExp(json.left.property);
    switch(arr.type){
    case 'ArrayExpression':  arr.elements[index.value] = val; break;
    case 'SequenceExpression': arr.expressions[index.value] = val; break;
    }
    savedVars[json.left.object.name] = arr;
    nodes += escodegen.generate(json) + '\n';
};

const handleFuncDec = (json, isGreen) => {
    getStringOfSVG(json.body, isGreen);
};

const handleExpStatement = (json, isGreen) => {
    getStringOfSVG(json.expression, isGreen);
};

const handleWhile = (json, isGreen) => {
    let whileName = createNewNode('operation', isGreen);
    nodes += 'NULL' + '\n';
    let condName = createNewNode('condition', isGreen);
    nodes += (escodegen).generate(json.test) + '\n';
    let bodyName = getStringOfSVG(json.body, isGreen)[0];
    //let paramTest = handleExp(JSON.parse(JSON.stringify(json.test)));
    passes += whileName + '->' + condName + '\n';
    passes += condName + '(yes, right)->' + bodyName + '\n';
    passes += bodyName + '(right)->' + whileName + '\n';
    nodesToConnect = [];
    nodesToConnect.push(condName + '(no)');
    return [condName + '(no)'];
};

const handleIf = (json, isGreen) =>{
    let nodeName = createNewNode('condition', isGreen);
    nodes += escodegen.generate(json.test) + '\n';
    let paramTest = handleExp(JSON.parse(JSON.stringify(json.test)));
    let isTrue = eval(stringExp(paramTest));
    let oldVars = copyMap(savedVars);
    nodesToConnect.push(nodeName + '(yes)');
    let connectToEnd = getStringOfSVG(json.consequent, isTrue && isGreen);
    savedVars = oldVars;
    nodesToConnect = []; //maybe add to connect to end?
    if(json.alternate != null){
        nodesToConnect.push(nodeName + '(no)');
        let connectToEnd2 = getStringOfSVG(json.alternate, !isTrue && isGreen);
        connectToEnd = connectToEnd.concat(connectToEnd2);
    }else connectToEnd.push(nodeName + '(no)');
    nodesToConnect = connectToEnd.slice();
    return connectToEnd;
};

const handleReturn = (json, isGreen) => {
    createNewNode('operation', isGreen);
    nodes += escodegen.generate(json) + '\n';
};

const handleSeq = (json, isGreen) => {
    //new node?
    json.expressions.forEach((exp)=> getStringOfSVG(exp, isGreen));
};

const handleUpdate = (json) => { //no array support
    // if(json.argument.type !== 'Identifier')
    //     return json;
    // if(json.operator === '++'){
    //     let j = JSON.parse('{"type": "BinaryExpression","operator": "+","left": {"type": "Identifier","name": "'+ json.argument.name +'"},"right": {"type": "Literal","value": 1,"raw": "1"}}\n');
    //     let val = handleExp(j, vars);
    //     vars[json.argument.name] = val;
    // }else if(json.operator === '--'){
    //     let j = JSON.parse('{"type": "BinaryExpression","operator": "-","left": {"type": "Identifier","name": "'+ json.argument.name +'"},"right": {"type": "Literal","value": 1,"raw": "1"}}\n');
    //     let val = handleExp(j, vars);
    //     vars[json.argument.name] = val;
    // }
    nodes += escodegen.generate(json) + '\n';
};

const typeHandlers = new Map([
    ['Program',handleProgram],
    ['FunctionDeclaration',handleFuncDec],
    ['BlockStatement',handleBlock],
    ['ExpressionStatement',handleExpStatement],
    ['AssignmentExpression',handleAssExp],
    ['WhileStatement',handleWhile],
    ['IfStatement',handleIf],
    ['ReturnStatement',handleReturn],
    ['SequenceExpression',handleSeq],
    ['VariableDeclaration',handleVarDec],
    ['UpdateExpression',handleUpdate]
]);

//-----------------Expression Handlers-------------------
const handleIdentifier = (exp) => {
    return savedVars[exp.name];
};
const handleLiteral = (exp) => { return exp; };
const handleBinaryExpression = (exp) => {
    let nExp = JSON.parse(JSON.stringify(exp));
    nExp.left = handleExp(nExp.left);
    nExp.right = handleExp(nExp.right);
    return nExp;
};
const handleUnaryExpression = (exp) => {
    exp.argument = handleExp(exp.argument);
    return exp;
};
const handleMemberExpression = (expr) => {
    let exp = JSON.parse(JSON.stringify(expr));
    exp.objetct = handleExp(exp.object);
    exp.property = handleExp(exp.property);
    let arr = savedVars[exp.object.name];
    return handleMemberExpressionHelper(arr, exp);
};

const handleMemberExpressionHelper = (arr, exp) => {
    let index = eval(stringExp(exp.property));
    switch(arr.type){
    case 'ArrayExpression':  return arr.elements[index];
    case 'SequenceExpression': return arr.expressions[index];
    }
};

const handleLogicalExpression = (exp) => {
    exp.left = handleExp(exp.left);
    exp.right = handleExp(exp.right);
    return exp;
};

const handleArray = (exp) => {
    let arr = exp.elements;
    for(let i = 0; i < arr.length; i++){
        arr[i] = handleExp(arr[i]);
    }
    return exp;
};

const expHandlers = new Map([
    ['Identifier', handleIdentifier],
    ['Literal', handleLiteral],
    ['BinaryExpression', handleBinaryExpression],
    ['UnaryExpression', handleUnaryExpression],
    ['MemberExpression', handleMemberExpression],
    ['LogicalExpression',handleLogicalExpression],
    ['ArrayExpression', handleArray]
]);

const handleExp = (exp) => {
    let handler = expHandlers.get(exp.type);
    return handler.call(undefined, exp);
};

//-----------------Expression to String Functions-------------------

const stringLiteral = (exp) => { return exp.value; };
const stringBinaryExpression = (exp) => { return ((exp.left.type === 'BinaryExpression' ? ('(' + (stringExp(exp.left)) + ')') : (stringExp(exp.left))) + ' ' + exp.operator + ' ' + (exp.right.type === 'BinaryExpression' ? ('(' + (stringExp(exp.right)) + ')') : (stringExp(exp.right)))); };
const stringUnaryExpression = (exp) => { return (exp.operator + stringExp(exp.argument)); };
const stringLogicalExpression = (exp) => { return (stringExp(exp.left) + ' ' + exp.operator + ' ' + stringExp(exp.right)); };
// const stringIdentifier = (exp) => {
//     let v = savedVars[exp.name];
//     return stringExp(v);
// };
// const stringMemberExpression = (exp) => {
//     console.log('yeet')
//     exp.objetct = handleExp(exp.object);
//     exp.property = handleExp(exp.property);
//     let arr = savedVars[exp.object.name];
//     // if (arr.type === 'ArrayExpression')
//     //     return stringExp(arr.elements[exp.property.value], vars);
//     // else if (arr.type === 'SequenceExpression')
//     return stringExp(arr.expressions[exp.property.value]);
// };

// const stringArray = (exp) => {
//     let arr = exp.elements;
//     let str = '[';
//     if(arr.length > 0)
//         str += stringExp(arr[0]);
//     for(let i = 1; i < arr.length; i++){
//         str +=  ',' + stringExp(arr[i]);
//     }
//     str += ']';
//     return str;
// };

const expToStringFuncs = new Map([
    ['Literal', stringLiteral],
    ['BinaryExpression', stringBinaryExpression],
    ['UnaryExpression', stringUnaryExpression],
    ['LogicalExpression',stringLogicalExpression],
    //['Identifier', stringIdentifier],
    //['MemberExpression', stringMemberExpression],
    //['ArrayExpression',stringArray]
]);

const stringExp = (exp) => {
    let handler = expToStringFuncs.get(exp.type);
    return handler.call(undefined, exp);
};

export {parseCode, parseAndGenerateStringOfSVG};

