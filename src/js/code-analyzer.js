import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{range: true});
};

let globalIndex = 1;
let newNodeIndex = 1;

const getGraphString = (oldGraphString,args,vars,initString)=>{
    let strLets = getInitialLets(args,vars);
    strLets = ';' + initString + strLets;
    let originalArr = oldGraphString.split('\n');
    let strArr = removeUnnecessaryStatements(originalArr);
    let i=0;
    for(;i<strArr.length;i++)
    {
        if(strArr[i].includes('->'))
        {
            break;
        }
    }
    let firstNode = strArr[1].substring(0,strArr[1].indexOf(' '));
    let newNodes = [];
    let newEdges = [];
    fMePlease(firstNode,strArr.slice(i+1),getMapFromName(strArr.slice(1,i)),newNodes,newEdges,strLets,true);
    let toReturn = getStringFromArray('',newNodes);
    return getStringFromArray(toReturn,newEdges);
};


const getInitialLets = (args,vars)=>{
    let buildArrArgs = parseCode('[' + args + ']');
    let toUseArr = buildArrArgs.body[0].expression.elements;
    let toReturn = '';
    for(let i=0;i<toUseArr.length;i++)
    {
        toReturn = toReturn + 'let ' + vars[i].name + '= ' + escodegen.generate(toUseArr[i]) + ';';
    }
    return toReturn;
};

const removeUnnecessaryStatements = (oldArr)=>{
    let toReturn = [];
    let exit = getExitNodeName(oldArr);
    for(let i=0;i<oldArr.length;i++)
    {
        if(!oldArr[i].includes('"exception"') && (!oldArr[i].includes(exit + ' [label="exit"'))&& (!oldArr[i].includes('-> ' + exit)))
        {
            toReturn.push(oldArr[i]);
        }
    }
    return toReturn;
};

const getStringFromArray = (initial,arr)=>{
    let toReturn = initial;
    for(let i=0;i<arr.length;i++)
    {
        if(toReturn === '') toReturn = toReturn + arr[i];
        else toReturn = toReturn + '\n' + arr[i];
    }
    return toReturn;
};
const getExitNodeName = (strArr) =>{
    for(let i=0;i<strArr.length;i++)
    {
        if(strArr[i].includes('label="exit"'))
        {
            return strArr[i].substring(0,strArr[i].indexOf(' '));
        }
    }
};
const fMePlease = (node,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint)=>{
    let next = findNext(node,edgesArr);
    if(next.length === 0) {
        addNode(node,varMap[node],newNodes,canPaint,'square');
    }
    else if(next.length > 1) {
        moreThanOneNext(node,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint);
    }
    else
    {
        onlyOneNext(node,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint);
    }
};

const onlyOneNext = (node,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint)=>{
    let res = mergeLetsAndAss(node,varMap,edgesArr);
    let str = res[0];
    let next = res[2];
    addNode(node,str,newNodes,canPaint,'square');
    addEdge(node,next[0].name,next[0].label,newEdges);
    return fMePlease(next[0].name,edgesArr,varMap,newNodes,newEdges,
        evaluationString + res[1],canPaint);
};

const addEdge = (from,to,label,edges)=>{
    if(!edgesContain(edges,from,to))
        edges.push(from + ' -> ' + to + ' [label="' + label + '"]');
};

const mergeLetsAndAss = (node,varMap,edgesArr)=>{
    let next = findNext(node,edgesArr);
    let strForNode = removeSemicolon(varMap[node]);
    let strForEval = addSemicolon(varMap[node]);
    let curr = {name : node};
    let doubleNext = findNext(next[0].name,edgesArr);
    let previous = findPrevious(next[0].name,edgesArr);
    while(next.length === 1 && doubleNext.length === 1 && previous.length === 1)
    {
        strForNode = removeSemicolon(strForNode + '\n' + varMap[next[0].name]);
        strForEval = addSemicolon(strForEval + '\n' + varMap[next[0].name]);
        curr = next[0];
        next = findNext(curr.name,edgesArr);
        doubleNext = findNext(next[0].name,edgesArr);
        previous = findPrevious(next[0].name,edgesArr);
    }
    strForNode = strForNode.replace(new RegExp('let ', 'g'),'');
    return [strForNode,strForEval,next];
};

const addSemicolon = (str)=>{
    return (str.slice(-1) !== ';')?str + ';':str;
};

const removeSemicolon = (str)=>{
    return (str.slice(-1) === ';')?str.substring(0,str.length-1) : str;
};

const moreThanOneNext = (node,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint)=>{
    let next = findNext(node,edgesArr);
    let continueFalse = next[1].name , continueTrue = next[0].name;
    expandCondition(edgesArr,node,varMap[node],varMap,newNodes,newEdges,continueFalse,continueTrue);
    addNode(node,varMap[node],newNodes,canPaint,'diamond');
    next = findNext(node,edgesArr);
    for(let i=0;i<next.length;i++)
        addEdge(node,next[i].name,next[i].label,newEdges);
    continueFalse = next[1].name;
    continueTrue = next[0].name;
    let boolHasFalse = edgesContain(newEdges,node,continueFalse) && nodeContain(newNodes,continueFalse);
    let boolHasTrue = edgesContain(newEdges,node,continueTrue) && nodeContain(newNodes,continueTrue);
    continuePaintMoreThanOneNext(edgesArr,node,varMap,boolHasFalse,boolHasTrue,evaluationString,continueTrue,continueFalse,newNodes,newEdges,canPaint);
};

const continuePaintMoreThanOneNext = (edgesArr,node,varMap,boolHasFalse,boolHasTrue,evaluationString,continueTrue,continueFalse,newNodes,newEdges,canPaint)=>{
    if(evalWithError(evaluationString,varMap[node])) {
        fMePlease(continueTrue,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint);
        if(boolHasFalse) return;
        fMePlease(continueFalse,edgesArr,varMap,newNodes,newEdges,'',false);
    }
    else {
        if(!boolHasTrue) fMePlease(continueTrue,edgesArr,varMap,newNodes,newEdges,'',false);
        fMePlease(continueFalse,edgesArr,varMap,newNodes,newEdges,evaluationString,canPaint);
    }
};

const evalWithError = (str1,str2)=>
{
    if(str1 === '') return false;
    try{
        return eval(str1+str2);
    }
    catch(e){return false;}
};

const addNode = (node,label,arrNodes,canPaint,shape)=>{
    if(canPaint)
    {
        addGreenNode(node,label,arrNodes,shape);
    }
    else
    {
        addRedNode(node,label,arrNodes,shape);
    }
};

const addGreenNode = (node,label,arrNodes,shape)=>{
    for(let i=0;i<arrNodes.length;i++)
    {
        if(arrNodes[i].indexOf(node + ' ') === 0)
        {
            if(!arrNodes[i].includes('green')) {
                let oldIndex = arrNodes[i].substring(arrNodes[i].indexOf('label'));
                oldIndex = oldIndex.substring(8,oldIndex.indexOf(')'));
                arrNodes[i] = node + ' [label="(' +oldIndex +')\n' + label + '",color="green",shape=' + shape + ']';
            }
            return;
        }
    }
    arrNodes.push(node + ' [label="(' + globalIndex +')\n' + label + '",color="green",shape=' + shape + ']');
    globalIndex = globalIndex + 1;
};

const addRedNode = (node,label,arrNodes,shape)=>{
    for(let i=0;i<arrNodes.length;i++)
    {
        if(arrNodes[i].indexOf(node + ' ') === 0)
        {
            return;
        }
    }
    arrNodes.push(node + ' [label="(' + globalIndex +')\n' + label + '",shape=' + shape + ']');
    globalIndex = globalIndex + 1;
};
const findNext = (nodeName, edgesArr)=>{
    let toReturn = [];
    for(let i=0;i<edgesArr.length;i++)
    {
        if(edgesArr[i].indexOf(nodeName + ' ') === 0)
        {
            toReturn.push(getTransitionTo(edgesArr[i]));
        }
    }
    return toReturn;
};

const findPrevious = (nodeName, edgesArr)=>{
    let toReturn = [];
    for(let i=0;i<edgesArr.length;i++)
    {
        if(edgesArr[i].includes('-> ' + nodeName + ' '))
        {
            toReturn.push(getTransitionTo(edgesArr[i]));
        }
    }
    return toReturn;
};

const getTransitionTo = (str)=>{
    let toReturn = {};
    let temp = str.substring(str.indexOf('->') + 3);
    toReturn['name'] = temp.substring(0,temp.indexOf(' '));
    temp = temp.substring(temp.indexOf('"')+1);
    toReturn['label'] = temp.substring(0,temp.indexOf('"'));
    return toReturn;
};

const getMapFromName = (nodesArr)=>{
    let toReturn = {};
    for(let i=0;i<nodesArr.length;i++)
    {
        let name = nodesArr[i].substring(0,nodesArr[i].indexOf(' '));
        let afterGershaim = nodesArr[i].substring(nodesArr[i].indexOf('"') + 1);
        toReturn[name] = afterGershaim.substring(0,afterGershaim.indexOf('"'));
    }
    return toReturn;
};

const edgesContain = (arrEdges,from,to) =>{
    for(let i=0;i<arrEdges.length;i++)
    {
        if(arrEdges[i].indexOf(from + ' ') === 0 && arrEdges[i].includes('-> ' + to))
            return true;
    }
    return false;
};

const nodeContain = (arrNodes,name)=>{
    for(let i=0;i<arrNodes.length;i++)
    {
        if(arrNodes[i].indexOf(name + ' ') === 0)
            return true;
    }
    return false;
};

const expandCondition = (originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue)=>{
    if(value.includes('&&'))
    {
        andExpansion(originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue);
    }
    else
    {
        if(value.includes('||'))
        {
            orExpansion(originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue);
        }
        else
        {
            dontExpand(originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue);
        }
    }

};

const andExpansion = (originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue)=>{
    varMap[node] =  value.substring(0,value.indexOf('&&'));
    let rightStr = value.substring(value.indexOf('&&')+2);
    let newRightNodeName = 'a' + newNodeIndex;
    newNodeIndex++;
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,newRightNodeName,'true');
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,continueFalse,'false');
    expandCondition(originalEdges,newRightNodeName,rightStr,varMap,newNodes,newEdges,continueFalse,continueTrue);
};

const orExpansion = (originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue)=>{
    varMap[node] =  value.substring(0,value.indexOf('||'));
    let rightStr = value.substring(value.indexOf('||')+2);
    let newRightNodeName = 'a' + newNodeIndex;
    newNodeIndex++;
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,continueTrue,'true');
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,newRightNodeName,'false');
    expandCondition(originalEdges,newRightNodeName,rightStr,varMap,newNodes,newEdges,continueFalse,continueTrue);
};

const dontExpand = (originalEdges,node,value,varMap,newNodes,newEdges,continueFalse,continueTrue)=>{
    varMap[node] = value;
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,continueTrue,'true');
    replaceInEdgesArrayFindByNameAndLabel(originalEdges,node,continueFalse,'false');
};

const replaceInEdgesArrayFindByNameAndLabel = (edgesArray,from,to,label)=>{
    for(let i=0;i<edgesArray.length;i++)
    {
        if(edgesArray[i].indexOf(from) === 0 && edgesArray[i].includes('label="'+label))
        {
            edgesArray[i] = from + ' -> ' + to + ' [label="' + label + '"]';
            return;
        }
    }
    edgesArray.push(from + ' -> ' + to + ' [label="' + label + '"]');
};

const resetGlobalIndex = ()=>{
    globalIndex = 1;
};

const resetNodeIndexNotVisible = ()=>{
    newNodeIndex = 1;
};

const getFunctionCodeAndInitialization = (code)=>{
    let initString = '';
    for(let i=0;i<code.length;i++)
    {
        if(code[i].type === 'FunctionDeclaration')
        {
            return [initString,code[i]];
        }
        else
        {
            initString = initString + escodegen.generate(code[i]);
        }
    }
};
export {parseCode,getGraphString,findNext,getMapFromName,getTransitionTo,findPrevious,addNode,resetGlobalIndex,edgesContain,nodeContain,resetNodeIndexNotVisible,
    getFunctionCodeAndInitialization};
