import assert from 'assert';
import {
    parseCode,
    findNext,
    getMapFromName,
    getTransitionTo,
    findPrevious,
    addNode,
    resetGlobalIndex,
    edgesContain,
    nodeContain,
    resetNodeIndexNotVisible,
    getGraphString, getFunctionCodeAndInitialization
} from '../src/js/code-analyzer';
import * as esgraph from 'esgraph';


let nodesArr = ['n0 [label="let a = x + 1;"]',
    'n1 [label="let b = a + y;"]',];
let edgesArr = ['n4 -> n10 [color="red", label=""]' , 'n5 -> n6 []'];
let trans1 = 'n0 -> n1 []';
let code1Big = 'let z = 1;function ReturnAverage(value, AS, MIN, MAX){\n' +
    '\tlet av;\n' +
    '\tlet i = 0, ti = 0, tv = 0, sum = 0;\n' +
    '\twhile (ti < AS && value[i] != -999) {\n' +
    '\t\tti++;\n' +
    '\t\tif (value[i] >= MIN && value[i] <= MAX) {\n' +
    '\t\t\ttv++;\n' +
    '\t\t\tsum = sum + value[i];\n' +
    '\t\t}\n' +
    '\t\ti++;\n' +
    '\t}\n' +
    '\tif (tv > 0)\n' +
    '\t\tav = sum/tv;\n' +
    '\telse\n' +
    '\t\tav =  -999;\n' +
    '\treturn  av;\n' +
    '}\n';
let res1Big = 'n1 [label="(1)\n' +
    'av\n' +
    'i = 0, ti = 0, tv = 0, sum = 0",color="green",shape=square]\n' +
    'n3 [label="(2)\n' +
    'ti < AS ",color="green",shape=diamond]\n' +
    'a1 [label="(3)\n' +
    ' value[i] != -999",color="green",shape=diamond]\n' +
    'n4 [label="(4)\n' +
    'ti++",color="green",shape=square]\n' +
    'n5 [label="(5)\n' +
    'value[i] >= MIN ",color="green",shape=diamond]\n' +
    'a2 [label="(6)\n' +
    ' value[i] <= MAX",color="green",shape=diamond]\n' +
    'n6 [label="(7)\n' +
    'tv++\n' +
    'sum = sum + value[i]",color="green",shape=square]\n' +
    'n8 [label="(8)\n' +
    'i++",color="green",shape=square]\n' +
    'n9 [label="(9)\n' +
    'tv > 0",color="green",shape=diamond]\n' +
    'n10 [label="(10)\n' +
    'av = sum/tv",color="green",shape=square]\n' +
    'n11 [label="(11)\n' +
    'return  av;",color="green",shape=square]\n' +
    'n12 [label="(12)\n' +
    'av =  -999",shape=square]\n' +
    'n1 -> n3 [label=""]\n' +
    'n3 -> a1 [label="true"]\n' +
    'n3 -> n9 [label="false"]\n' +
    'a1 -> n4 [label="true"]\n' +
    'a1 -> n9 [label="false"]\n' +
    'n4 -> n5 [label=""]\n' +
    'n5 -> a2 [label="true"]\n' +
    'n5 -> n8 [label="false"]\n' +
    'a2 -> n6 [label="true"]\n' +
    'a2 -> n8 [label="false"]\n' +
    'n6 -> n8 [label=""]\n' +
    'n8 -> n3 [label=""]\n' +
    'n9 -> n10 [label="true"]\n' +
    'n9 -> n12 [label="false"]\n' +
    'n10 -> n11 [label=""]\n' +
    'n12 -> n11 [label=""]';
let code2Big = 'let z = 1;function ReturnAverage(value, AS, MIN, MAX){\n' +
    '\tlet av;\n' +
    '\tlet i = 0, ti = 0, tv = 0, sum = 0;\n' +
    '\twhile (ti < AS || value[i] != -999) {\n' +
    '\t\tti++;\n' +
    '\t\tif (value[i] >= MIN && value[i] <= MAX) {\n' +
    '\t\t\ttv++;\n' +
    '\t\t\tsum = sum + value[i];\n' +
    '\t\t}\n' +
    '\t\ti++;\n' +
    '\t}\n' +
    '\tif (tv > 0)\n' +
    '\t\tav = sum/tv;\n' +
    '\telse\n' +
    '\t\tav =  -999;\n' +
    '\treturn  av;\n' +
    '}\n';
let res2Big = 'n1 [label="(1)\n' +
    'av\n' +
    'i = 0, ti = 0, tv = 0, sum = 0",color="green",shape=square]\n' +
    'n3 [label="(2)\n' +
    'ti < AS ",color="green",shape=diamond]\n' +
    'n4 [label="(3)\n' +
    'ti++",shape=square]\n' +
    'n5 [label="(4)\n' +
    'value[i] >= MIN ",shape=diamond]\n' +
    'a2 [label="(5)\n' +
    ' value[i] <= MAX",shape=diamond]\n' +
    'n6 [label="(6)\n' +
    'tv++\n' +
    'sum = sum + value[i]",shape=square]\n' +
    'n8 [label="(7)\n' +
    'i++",shape=square]\n' +
    'a1 [label="(8)\n' +
    ' value[i] != -999",color="green",shape=diamond]\n' +
    'n9 [label="(9)\n' +
    'tv > 0",color="green",shape=diamond]\n' +
    'n10 [label="(10)\n' +
    'av = sum/tv",shape=square]\n' +
    'n11 [label="(11)\n' +
    'return  av;",color="green",shape=square]\n' +
    'n12 [label="(12)\n' +
    'av =  -999",color="green",shape=square]\n' +
    'n1 -> n3 [label=""]\n' +
    'n3 -> n4 [label="true"]\n' +
    'n3 -> a1 [label="false"]\n' +
    'n4 -> n5 [label=""]\n' +
    'n5 -> a2 [label="true"]\n' +
    'n5 -> n8 [label="false"]\n' +
    'a2 -> n6 [label="true"]\n' +
    'a2 -> n8 [label="false"]\n' +
    'n6 -> n8 [label=""]\n' +
    'n8 -> n3 [label=""]\n' +
    'a1 -> n4 [label="true"]\n' +
    'a1 -> n9 [label="false"]\n' +
    'n9 -> n10 [label="true"]\n' +
    'n9 -> n12 [label="false"]\n' +
    'n10 -> n11 [label=""]\n' +
    'n12 -> n11 [label=""]';
describe('The javascript parser', () => {
    /*it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });*/
    it('getting map from nodes array', () => {
        assert.equal(
            JSON.stringify(getMapFromName(nodesArr)),
            '{"n0":"let a = x + 1;","n1":"let b = a + y;"}'
        );
    });
    it('getting transition to', () => {
        assert.equal(
            JSON.stringify(getTransitionTo(trans1)),
            '{"name":"n1","label":""}'
        );
    });
    it('find previous', () => {
        assert.equal(
            findPrevious('n1',edgesArr).length, 1
        );
    });
    it('find next', () => {
        assert.equal(
            findNext('n4',edgesArr).length, 1
        );
    });
    it('addNodeColorFalse', () => {
        resetGlobalIndex();
        let newNode = [];
        addNode('n0','',newNode,false,'square');
        assert.equal(
            newNode[0], 'n0 [label="(1)\n",shape=square]'
        );
    });
    it('addNodeColorFalseExists', () => {
        resetGlobalIndex();
        let newNode = ['n0 [label="(1)\nlet b = a + y;",shape=square]'];
        addNode('n0','',newNode,false,'square');
        assert.equal(
            newNode[0], 'n0 [label="(1)\nlet b = a + y;",shape=square]'
        );
    });
    it('addNodeColorFalseNotExist', () => {
        resetGlobalIndex();
        let newNode = ['n1 [label="(1)\nlet b = a + y;",shape=square]'];
        addNode('n0','',newNode,false,'square');
        assert.equal(
            newNode[0], 'n1 [label="(1)\nlet b = a + y;",shape=square]'
        );
        assert.equal(
            newNode[1], 'n0 [label="(1)\n",shape=square]'
        );
    });
    it('addNodeColorTrue', () => {
        resetGlobalIndex();
        let newNode = [];
        addNode('n0','',newNode,true,'square');
        assert.equal(
            newNode[0], 'n0 [label="(1)\n",color="green",shape=square]'
        );
    });
    it('addNodeColorTrueExistsRed', () => {
        resetGlobalIndex();
        let newNode = ['n0 [label="(1)\n",shape=square]'];
        addNode('n0','',newNode,true,'square');
        assert.equal(
            newNode[0], 'n0 [label="(1)\n",color="green",shape=square]'
        );
    });
    it('addNodeColorTrueExistsGreen', () => {
        resetGlobalIndex();
        let newNode = ['n0 [label="(1)\n",color="green",shape=square]'];
        addNode('n0','',newNode,true,'square');
        assert.equal(
            newNode[0], 'n0 [label="(1)\n",color="green",shape=square]'
        );
    });
    it('addNodeColorTrueNotExists', () => {
        resetGlobalIndex();
        let newNode = ['n1 [label="(1)\n",color="green",shape=square]'];
        addNode('n0','',newNode,true,'square');
        assert.equal(
            newNode[0], 'n1 [label="(1)\n",color="green",shape=square]'
        );
        assert.equal(
            newNode[1], 'n0 [label="(1)\n",color="green",shape=square]'
        );
    });
    it('edgesContainCheckExists', () => {
        resetGlobalIndex();
        let arrEdges = ['n0 -> n1 [color="red", label=""]'];
        assert.equal(
            edgesContain(arrEdges,'n0','n1'), true
        );
    });
    it('edgesContainCheckNotExists', () => {
        resetGlobalIndex();
        let arrEdges = ['n0 -> n2 [color="red", label=""]'];
        assert.equal(
            edgesContain(arrEdges,'n0','n1'), false
        );
    });
    it('nodesContainCheckExists', () => {
        resetGlobalIndex();
        let arrEdges = ['n0 [label="let a = x + 1;"]'];
        assert.equal(
            nodeContain(arrEdges,'n0'), true
        );
    });
    it('nodesContainCheckNotExists', () => {
        resetGlobalIndex();
        let arrEdges = ['n1 [label="let a = x + 1;"]'];
        assert.equal(
            nodeContain(arrEdges,'n0'), false
        );
    });
    it('BigOne1', () => {
        resetGlobalIndex();
        resetNodeIndexNotVisible();
        let args = '[1,2,3,-999],10,0,10';
        let parsedCode = parseCode(code1Big);
        let res = getFunctionCodeAndInitialization(parsedCode.body);
        const cfg = esgraph(res[1].body);
        let dot = esgraph.dot(cfg,{counter: 0 ,source: code1Big});
        assert.equal(
            getGraphString(dot,args,res[1].params,res[0]), res1Big
        );
    });
    it('BigOne2', () => {
        resetGlobalIndex();
        resetNodeIndexNotVisible();
        let args = '[-999,2,3,-999],-1,0,10';
        let parsedCode = parseCode(code2Big);
        let res = getFunctionCodeAndInitialization(parsedCode.body);
        const cfg = esgraph(res[1].body);
        let dot = esgraph.dot(cfg,{counter: 0 ,source: code2Big});
        assert.equal(
            getGraphString(dot,args,res[1].params,res[0]), res2Big
        );
    });
});
