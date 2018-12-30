import assert from 'assert';
import {parseCode, parseAndGenerateStringOfSVG} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
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
    });

    it('is parsing a while statement correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a++;\n' +
            '   }\n' +
            '   \n' +
            '   return z;\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
        'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>operation: #2:\n' +
            'NULL|green\n' +
            'node3=>condition: #3:\n' +
            'a < z|green\n' +
            'node4=>operation: #4:\n' +
            'c = a + b\n' +
            'z = c * 2\n' +
            'a++|green\n' +
            'node5=>operation: #5:\n' +
            'return z;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2->node3\n' +
            'node3(yes, right)->node4\n' +
            'node4(right)->node2\n' +
            'node3(no)->node5\n');
    });


    it('is parsing an if statement correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
        'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>condition: #2:\n' +
            'b < z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'node4=>condition: #4:\n' +
            'b < z * 2|green\n' +
            'node5=>operation: #5:\n' +
            'c = c + x + 5|green\n' +
            'node6=>operation: #6:\n' +
            'c = c + z + 5\n' +
            'node7=>operation: #7:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node2(no)->node4\n' +
            'node4(yes)->node5\n' +
            'node4(no)->node6\n' +
            'node3->node7\n' +
            'node5->node7\n' +
            'node6->node7\n');
    });



    it('is parsing an if statement with no else correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    }\n' +
            '    return c;\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>condition: #2:\n' +
            'b < z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'node4=>operation: #4:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node3->node4\n' +
            'node2(no)->node4\n');
    });


    it('is parsing an member expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x[1] + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    x[0] = 3;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + x[0];\n' +
            '    }\n' +
            '    return c;\n' +
            '}\n', '{"x":[0,1],"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x[1] + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;\n' +
            'x[0] = 3|green\n' +
            'node2=>condition: #2:\n' +
            'b < z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + x[0]\n' +
            'node4=>operation: #4:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node3->node4\n' +
            'node2(no)->node4\n');
    });


    it('is parsing an unary expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a++;\n' +
            '   }\n' +
            '   \n' +
            '   return -z;\n' +
            '}', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>operation: #2:\n' +
            'NULL|green\n' +
            'node3=>condition: #3:\n' +
            'a < z|green\n' +
            'node4=>operation: #4:\n' +
            'c = a + b\n' +
            'z = c * 2\n' +
            'a++|green\n' +
            'node5=>operation: #5:\n' +
            'return -z;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2->node3\n' +
            'node3(yes, right)->node4\n' +
            'node4(right)->node2\n' +
            'node3(no)->node5\n');
    });

    it('is parsing a member expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5, a = [1,2];\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>condition: #2:\n' +
            'b < z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'a = [\n' +
            '    1,\n' +
            '    2\n' +
            ']\n' +
            'node4=>condition: #4:\n' +
            'b < z * 2|green\n' +
            'node5=>operation: #5:\n' +
            'c = c + x + 5|green\n' +
            'node6=>operation: #6:\n' +
            'c = c + z + 5\n' +
            'node7=>operation: #7:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node2(no)->node4\n' +
            'node4(yes)->node5\n' +
            'node4(no)->node6\n' +
            'node3->node7\n' +
            'node5->node7\n' +
            'node6->node7\n');
    });

    it('is parsing a logical expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2 && c == 0) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n' +
            '\n', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>condition: #2:\n' +
            'b < z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'node4=>condition: #4:\n' +
            'b < z * 2 && c == 0|green\n' +
            'node5=>operation: #5:\n' +
            'c = c + x + 5|green\n' +
            'node6=>operation: #6:\n' +
            'c = c + z + 5\n' +
            'node7=>operation: #7:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node2(no)->node4\n' +
            'node4(yes)->node5\n' +
            'node4(no)->node6\n' +
            'node3->node7\n' +
            'node5->node7\n' +
            'node6->node7\n');
    });

    it('is parsing an unary expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c;\n' +
            '    c = 0;\n' +
            '    if (-b < -z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let a = x + 1;\n' +
            'let b = a + y;\n' +
            'let c;\n' +
            'c = 0|green\n' +
            'node2=>condition: #2:\n' +
            '-b < -z|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'node4=>condition: #4:\n' +
            'b < z * 2|green\n' +
            'node5=>operation: #5:\n' +
            'c = c + x + 5|green\n' +
            'node6=>operation: #6:\n' +
            'c = c + z + 5\n' +
            'node7=>operation: #7:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node2(no)->node4\n' +
            'node4(yes)->node5\n' +
            'node4(no)->node6\n' +
            'node3->node7\n' +
            'node5->node7\n' +
            'node6->node7\n');
    });

    it('is parsing an empty expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            ';\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:|green\n' +
            '\n' +
            'st->node1\n');
    });


    it('is parsing a local array expression correctly', () => {
        assert.equal(parseAndGenerateStringOfSVG('function foo(x, y, z){\n' +
            '    let d = [5,3]\n' +
            '    d[0] = 1;\n' +
            '    let a = d[0] + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < d[1]) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n', '{"x":1,"y":2,"z":3}'),
            'st=>start: Start\n' +
            'node1=>operation: #1:\n' +
            'let d = [\n' +
            '    5,\n' +
            '    3\n' +
            '];\n' +
            'd[0] = 1\n' +
            'let a = d[0] + 1;\n' +
            'let b = a + y;\n' +
            'let c = 0;|green\n' +
            'node2=>condition: #2:\n' +
            'b < d[1]|green\n' +
            'node3=>operation: #3:\n' +
            'c = c + 5\n' +
            'node4=>condition: #4:\n' +
            'b < z * 2|green\n' +
            'node5=>operation: #5:\n' +
            'c = c + x + 5|green\n' +
            'node6=>operation: #6:\n' +
            'c = c + z + 5\n' +
            'node7=>operation: #7:\n' +
            'return c;|green\n' +
            '\n' +
            'st->node1\n' +
            'node1->node2\n' +
            'node2(yes)->node3\n' +
            'node2(no)->node4\n' +
            'node4(yes)->node5\n' +
            'node4(no)->node6\n' +
            'node3->node7\n' +
            'node5->node7\n' +
            'node6->node7\n');
    });

});
