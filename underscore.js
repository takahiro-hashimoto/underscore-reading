
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

    // Baseline setup
    // --------------

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var
    push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
    nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;

    // Naked function reference for surrogate-prototype-swapping.
    var Ctor = function() {};

    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.
    _.VERSION = '1.8.3';

    /*
    Underscoreの内部関数で各メソッドの配列の各値を処理する関数にあたる引数のthisなどを条件によって設定する関数。
    */
    var optimizeCb = function(func, context, argCount) {

        // 第2引数のcontextがundefinedの場合、そのままfuncが返る。
        if (context === void 0) return func;

        //switch文。第3引数のargCountの値によって処理が分かれる。
        switch (argCount == null ? 3 : argCount) {
            // contextをfuncのthisにしてargumentsの数が条件によって増える。
            case 1:
                return function(value) {
                    return func.call(context, value);
                };
            case 2:
                return function(value, other) {
                    return func.call(context, value, other);
                };
            case 3:
                return function(value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            case 4:
                return function(accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                };
        }
        //contextがundefined以外でargCountがundefinedの場合の処理
        return function() {
            return func.apply(context, arguments);
        };
    };

    /*
    Underscoreの内部関数で各メソッドの配列の各値を処理する関数にあたる引数の型を判別し関数として返す関数。
    */
    var cb = function(value, context, argCount) {
        // valueがnullだった場合、_.identityを返す（引数をそのまま返す）
        if (value == null) return _.identity;

        // valueが関数だった場合、optimizeCbに引数が代入される。
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);

        // valueがObjectだった場合、_.matcher()にvalueが代入される。
        if (_.isObject(value)) return _.matcher(value);

        // valueが関数でなく、Objectでもない値だった場合、_.property()にvalueが代入される。
        return _.property(value);
    };
    // 引数の型を判別し関数を返す内部関数cb()に引数を渡す関数。Infinity??
    _.iteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    /*
    _.extend(), _.extendOwn(), _.defaults() から呼ばれる内部関数。
    createAssigner()からは部分適用した関数が返ってくる。
    */
    var createAssigner = function(keysFunc, undefinedOnly) {
        // createAssignerから返される部分適用した関数。
        return function(obj) {
            // 返される関数の引数の長さ。
            var length = arguments.length;
            // 引数の長さが2未満か引数が null だった場合。
            if (length < 2 || obj == null) return obj;
            // 返される関数の引数が2つ以上の時の処理。
            for (var index = 1; index < length; index++) {
              // 第2引数から
                var source = arguments[index],
                    // keysFunc は _.keys() か _.allKeys() どちらか。
                    // 第2引数以降の引数のkey値の配列作成。
                    keys = keysFunc(source),
                    l = keys.length;
                // 第2引数「Object」のkey値とその値を第1引数「Object」にコピーするループ。
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    // _.defaults = createAssigner(_.allKeys, true);、_.extend(),_.extendOwn() はこのif文は必ず実行される。
                    if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
                }
            }
            // コピーされた第1引数を返す。
            return obj;
        };
    };

    /*
    引数がObjectの時、引数をプロトタイプとするObjectを新規作成して返す
    */
    var baseCreate = function(prototype) {
        // 引数の型がObjectじゃない時に{}を返す
        if (!_.isObject(prototype)) return {};

        // _内で宣言されている。nativeCreate = Object.create;
        // 引数をプロトタイプとするObjectを新規作成して返す。
        if (nativeCreate) return nativeCreate(prototype);
        // nativeCreate = false の時の処理。
        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    };

　　//引数がnullでないかチェック
    var property = function(key) {
        return function(obj) {
            //obgがnullならundefind, そうでなければkeyを返す
            return obj == null ? void 0 : obj[key];
        };
    };

    // MAX_ARRAY_INDEX = 9007199254740991
    //2の53乗-1
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    //引数のlengthを取得
    var getLength = property('length');

    var isArrayLike = function(collection) {
         // collection が false 以外だったら length = collection.length;
        var length = getLength(collection);
        // 真偽値を返す。
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // Collection Functions
    // --------------------

    /*
    第2引数で指定した関数に第1引数「配列（Object）」の各値（ val, index, 配列自身 ）を入力して適用。
    */
    _.each = _.forEach = function(obj, iteratee, context) {
        // 第2引数が関数かどうかチェック
        // 第3引数 = undefined で 第2引数の型が function なら iteratee = 第2引数のまま。
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        // isArrayLike(obj) は objが配列かargumentsの時、trueを返す。
        if (isArrayLike(obj)) {
          　// 配列とargumentsの時の処理。
          　// 関数に 配列の値、index値、配列自身を渡す。
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            // Objectの時の処理。
            // Object の key のみの配列を抽出。
            var keys = _.keys(obj);
            // 第2引数に Objectの値、Objectのkey、Object自身を渡す。
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };

    /*
    第1引数「配列（Object）」の各値に第2引数で指定した関数を適用し、結果を配列にして返す。
    */
    _.map = _.collect = function(obj, iteratee, context) {
        // 第3引数（context）があれば thisに設定する。
        // 第2引数（iteratee）が関数で第3引数（context）がundefinedなら第2引数（iteratee）の関数のまま。
        iteratee = cb(iteratee, context);

        // obj が配列じゃなかったら、objのkeyの配列を抽出。
        var keys = !isArrayLike(obj) && _.keys(obj),
            // objのlength抽出。
            length = (keys || obj).length,
            results = Array(length);
        // objの各値に関数を適用し、結果を配列にする処理。
        for (var index = 0; index < length; index++) {
            //三項演算子
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    //「dir = 1」が適用された関数を返す。
    function createReduce(dir) {

        // 下の返される関数で最後に呼ばれる関数。
        function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            // 累積した結果を返す。
            return memo;
        }

        // _.reduce()の引数はこの返される関数の引数。
        return function(obj, iteratee, memo, context) {
            // 引数contextがない場合は iteratee関数がそのまま返る。
            iteratee = optimizeCb(iteratee, context, 4);

            // 引数 obj が Object なら key 値の配列を作成。
            var keys = !isArrayLike(obj) && _.keys(obj),

                // 引数objのlengthを抽出。
                length = (keys || obj).length,

                // _.reduce() は前から処理するため、index = ０。
                index = dir > 0 ? 0 : length - 1;

            // 引数が3未満なら 配列の最初の値をメモする。
            if (arguments.length < 3) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            return iterator(obj, iteratee, memo, keys, index, length);
        };
    }

　　/*ここわからん*/
    _.reduce = _.foldl = _.inject = createReduce(1);

    _.reduceRight = _.foldr = createReduce(-1);
   /*ここわからん*/

    _.find = _.detect = function(obj, predicate, context) {
        var key;
        if (isArrayLike(obj)) {
            // objが配列なら_.findIndex()で条件を満たしている値のindex値が返される。
            key = _.findIndex(obj, predicate, context);
        } else {
            // objがObjectなら_.findKey()で条件を満たしている値のindex値が返される。
            key = _.findKey(obj, predicate, context);
        }
        // 条件を満たしているobjの最初の値が返される。
        if (key !== void 0 && key !== -1) return obj[key];
    };


   /*
   第1引数「配列（Object）」の値の中で第2引数の関数の条件を満たしている値のみの配列を返す。
   */
    _.filter = _.select = function(obj, predicate, context) {
        var results = [];
        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        predicate = cb(predicate, context);

        // objのそれぞれの値を関数で処理。条件を満たしている値のみresultsにpushされる。
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        // 条件を満たしている値のみの配列が返される。
        return results;
    };

    /*
    第1引数「配列」の値の中で第2引数の関数の条件を満たしていない値のみの配列を返す。
    */
    _.reject = function(obj, predicate, context) {
        // 第2引数の predicateが_.negate()に渡されるので条件を満たさない値のみとなる。
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    /*
    第1引数「配列」の値の全てが第2引数の関数の条件を満たしている時に true を返す。1つでも満たしていない値があれば false を返す。
    */
    _.every = _.all = function(obj, predicate, context) {
        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        predicate = cb(predicate, context);

        // 配列だったらkeys = undefined 、Objectだったら keysはObjectのkeyの配列。
        var keys = !isArrayLike(obj) && _.keys(obj),
            // length 抽出処理。
            length = (keys || obj).length;
        // 配列（Object）の各値を処理。
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            // predicate の条件を満たしていない値の時にif( true )になるので false が返される。
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
        }
        return true;
    };

    /*
    第1引数「配列」の値の中で第2引数の関数の条件を満たしている時に true を返す。
    全部の値が条件を満たしていなければ false を返す。
    */
    _.some = _.any = function(obj, predicate, context) {

        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        predicate = cb(predicate, context);

        // 配列だったら keys = undefined 、Objectだったら keys は Object の key の配列。
        var keys = !isArrayLike(obj) && _.keys(obj),

            // length 抽出処理。
            length = (keys || obj).length;

        // 配列（Object）の各値を処理。
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;

            // 1回でも predicate の条件を満たした値の時にif( true )になるので true が返される。
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }

        // 1度も条件を満たさなかったら false が返る。
        return false;
    };

    /*
    1引数「配列」の値の中で第2引数の値が含まれていた時、true を返す。
    */
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {

        // objが配列とargumentsでなかったら、objの値を抽出した配列をobjに代入する。
        if (!isArrayLike(obj)) obj = _.values(obj);
        if (typeof fromIndex != 'number' || guard) fromIndex = 0;
        // 第3引数 fromIndex は型が数字で undefined じゃなかったら fromIndex がそのまま渡され、数字でない場合等は false が渡され、
        // _.indexOf( obj, target, fromIndex ) が実行される。
        return _.indexOf(obj, item, fromIndex) >= 0;
    };

    /*
    第1引数「入れ子の配列」に第2引数で指定したメソッドを各配列に実行する。
    */
    _.invoke = function(obj, method) {
        // arguments.slice( 2 ); ほとんど args = [ ]; になる。
        var args = slice.call(arguments, 2);

        // methodが関数かどうか確認される。_内で定義されている文字列でないと isFunc = true にならない。
        var isFunc = _.isFunction(method);
        return _.map(obj, function(value) {

            // isFunc = true なら第1引数「obj」の各値を this、引数を args とした method 処理が行われる。
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
        });
    };

    /*
    第1引数「配列」の値（Object）の中で第2引数をkeyにした値の配列を返す。
    */
    _.pluck = function(obj, key) {
        // _.property(key)(val) の結果を配列として返す。
        return _.map(obj, _.property(key));
    };

    /*
    第1引数「配列」の値の中で第2引数「Object」のkeyと値を含んでる第1引数の値のみの配列を返す。
    */
    _.where = function(obj, attrs) {
      // _.filter()にobjと_.matcher（同じプロパティと値があるかを判別する部分適用した関数）を渡す。
      // 条件に該当するものだけの配列を返す。
        return _.filter(obj, _.matcher(attrs));
    };

    /*
    第1引数「配列」の値の中で第2引数「Object」のkeyとその値を含んでる配列の最初の値を返す。
    */
    _.findWhere = function(obj, attrs) {
      // _.find()にobjと_.matcher（同じプロパティと値があるかを判別する部分適用した関数）を渡す。
      // 条件に該当する最初の値を返す。
        return _.find(obj, _.matcher(attrs));
    };


    /*
    第1引数「配列」の中で値の最大値を返す。第2引数が指定されていた場合は、配列の各値に第2引数を適用した値の中で最大のものを返す。
    */
    _.max = function(obj, iteratee, context) {
        var result = -Infinity,
            lastComputed = -Infinity,
            value, computed;
        // 第2引数「iteratee」が null で第1引数「obj」が null じゃない時。
        if (iteratee == null && obj != null) {

            // 第1引数「obj」が配列か arguments ならそのまま。Object なら key 配列を作成。
            obj = isArrayLike(obj) ? obj : _.values(obj);

            // 第1引数「obj」の各値で最大のものを調べるforループ。
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {

            // 第2引数「iteratee」が null じゃない時。
            // 第3引数が入力されていない、第2引数が関数ならそのまま。
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index, list) {

                // 第1引数「obj」の各値を第2引数「iteratee」で適用した値 = computed。
                computed = iteratee(value, index, list);

                // computed の値が比べられ最大値の値がresultになる。
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        // 最大値の値 == result が返る。
        return result;
    };

    /*
    第1引数「配列」の中で値の最小値を返す。第2引数が指定されていた場合は、配列の各値に第2引数を適用した値の中で最小のものを返す。
    */
    _.min = function(obj, iteratee, context) {
        var result = Infinity,
            lastComputed = Infinity,
            value, computed;
        // 第2引数「iteratee」が null で第1引数「obj」が null じゃない時。
        if (iteratee == null && obj != null) {

            // 第1引数「obj」が配列か arguments ならそのまま。Object なら key 配列を作成。
            obj = isArrayLike(obj) ? obj : _.values(obj);

            // 第1引数「obj」の各値で最小のものを調べるforループ。
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            // 第2引数「iteratee」が null じゃない時。
            // 第3引数が入力されていない、第2引数が関数ならそのまま。
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index, list) {
                // 第1引数「obj」の各値を第2引数「iteratee」で適用した値 = computed。
                computed = iteratee(value, index, list);

                // computed の値が比べられ最小値の値がresultになる。
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        // 最小値の値 == result が返る。
        return result;
    };


　　 /*
    配列（ Object ）の各値の位置をランダムに入れ替えた配列を返す関数。
    */
    _.shuffle = function(obj) {
        // 引数「obj」が配列か arguments だったらそのまま。Object だったら Object の値の配列を作る。
        var set = isArrayLike(obj) ? obj : _.values(obj);

        //lengtを取得
        var length = set.length;

        // 結果を入れる配列を作る。
        var shuffled = Array(length);

        // 引数「obj」の値をランダムに入れ替えた配列を作るforループ。
        for (var index = 0, rand; index < length; index++) {
            rand = _.random(0, index);

            // 配列のnullを排除しているif。shuffled[index] = shuffled[rand]; が空席を埋める機能を果たしている。
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }
        return shuffled;
    };


    /*
    引数が1つの時は、配列( Object )の各値の中からランダムに1つを返す。
    第2引数も指定されていた場合は配列の値の位置をランダムに入れ替え、それをindex値の最初から第2引数までsliceした配列を返す。
    */
    _.sample = function(obj, n, guard) {

        // 第2引数が null または第3引数が undefined じゃない場合。
        if (n == null || guard) {

            // 第1引数が Object だった場合、Object の値だけの配列を作る。
            if (!isArrayLike(obj)) obj = _.values(obj);

            // length-1と0の間のランダムなindex値の値を返す。
            return obj[_.random(obj.length - 1)];
        }
        // 配列の値の位置をランダムに入れ替え、それを最初からnまでのsliceした配列を返す。
        return _.shuffle(obj).slice(0, Math.max(0, n));
    };


    /*
    第1引数「配列」のみの場合、配列の中をソートしてくれる。
    第2引数は配列の中の値がObjectの時のソートする基準となるkeyを指定する。
    */
    _.sortBy = function(obj, iteratee, context) {
        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        iteratee = cb(iteratee, context);

        // _.map() は { value, index, iterateeを適用した値 } の配列を作る。
        return _.pluck(_.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iteratee(value, index, list)
            };
        // Array.sort()で上記で作成した配列をソートする。
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            // _.pluck() で value（Object）を抽出した配列を返す。
            return left.index - right.index;
        }), 'value');
    };

    var group = function(behavior) {
        // _.groupBy() の引数は以下の返される関数に代入される。
        return function(obj, iteratee, context) {
            var result = {};

            // 第3引数が入力されていない、第2引数が関数ならそのまま。
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index) {
                // 第1引数の各値（Object）に第2引数の関数が適用された結果。
                var key = iteratee(value, index, obj);

                // group() の引数がセットされ関数として機能する。
                behavior(result, value, key);
            });
            return result;
        };
    };

    /*
    第1引数「配列」の各値を第2引数「関数」でグループ分けした Object を返す。
    */
    // group()の最後に function(result, value, key) { } が呼び出される。
    _.groupBy = group(function(result, value, key) {

        // 「result」Object の中に key のgroup毎の配列に値が分けられる。
        if (_.has(result, key)) result[key].push(value);
        else result[key] = [value];
    });


    /*
    第1引数「配列」の各値を第2引数「関数」でグループ分けした Object を返す。ただし各グループ、値は1つずつ。
    */
    // group()の最後に function(result, value, key) { } が呼び出される。
    _.indexBy = group(function(result, value, key) {
        result[key] = value;
    });


    /*
    第1引数「配列」の各値を第2引数「関数」でグループ分けしたObjectを返す。Objectの中身は指定したkeyとそのグループの数。
    */
    // group()の最後に function(result, value, key) { } が呼び出される。
    _.countBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key]++;
        else result[key] = 1;
    });


    /*
    第1引数「Object」の値を配列にして返す。
    */
    _.toArray = function(obj) {
        // 第一引数がobgじゃなかったらfalse
        if (!obj) return [];

        // obj が配列なら
        if (_.isArray(obj)) return slice.call(obj);

        // obj が arguments なら
        if (isArrayLike(obj)) return _.map(obj, _.identity);

        // obj の値だけを抽出した配列を返す。
        return _.values(obj);
    };

    /*
    配列（Object）の長さを返す。
    */
    _.size = function(obj) {
        // obj が空だったら、0を返す
        if (obj == null) return 0;

        // objが配列だったら配列の長さを返す。ObjectだったらObjectのkeyの値の配列の長さを返す。
        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };


    /*
    第1引数「配列（Object）」の各値を第2引数の関数の条件によって振り分ける。
    */
    _.partition = function(obj, predicate, context) {
        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        predicate = cb(predicate, context);
        var pass = [],
            fail = [];

        // 第1引数「配列（Object）」の各値を第2引数の関数の条件によって振り分ける。
        _.each(obj, function(value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
        });
        return [pass, fail];
    };




    // Array Functions
    // ---------------

    /*
    第1引数「配列」を第2引数で指定された数だけ後ろから削除され、残り配列が返る。
    第2引数が指定されていない時は1番最初の値だけが返る。
    */
    _.first = _.head = _.take = function(array, n, guard) {
        //第1引数がnullならundefinedを返す
        if (array == null) return void 0;

        // 第2引数がnull か, 第3引数がfalse だったら第1引数「配列」の0番目を返す。
        if (n == null || guard) return array[0];

        // 第1引数のArrayとArrayのArrayの数からn引いたものを_.initialに渡した結果が返ってくる
        return _.initial(array, array.length - n);
    };

    // 第2引数が指定されていた時、第2引数で指定された数だけ後ろから削除された第1引数 array が返る
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    /*
    第1引数「配列」を index = 0 から第2引数の数まで指定された数だけ前から削除され、残りの配列が返る。
    第2引数が指定されていない時は1番最後の値だけが返る。
    */
    _.last = function(array, n, guard) {
        //第1引数がnullならundefinedを返す
        if (array == null) return void 0;

        // 第2引数がnullか, 第3引数がfalse だったら第1引数「配列」の最後の値を返す。
        if (n == null || guard) return array[array.length - 1];

        // 第1引数と、配列からnを引いた一番大きい数をrest関数に渡した結果が返ってくる
        //Math.max→引数として与えた複数の数の中で最大の数を返す
        return _.rest(array, Math.max(0, array.length - n));
    };

    /*
    第1引数「配列」のindex値 = 0 から 第2引数の数までの値が削除され、残りの配列が返される。
    第1引数のみの時は、最初のindex値が削除され残りが返る。
    */
    _.rest = _.tail = _.drop = function(array, n, guard) {
        // n == null か guard == true の時、slice.call( array, 1 );
        // n が指定されている時、slice.call( array, n );
        return slice.call(array, n == null || guard ? 1 : n);
    };

    //引数「配列」の各値で「false」となるものを排除した配列が返される
    _.compact = function(array) {
        // 引数と_.identity（配列の各値をそのまま返す関数）を_.filter() に渡す。
        // 配列の各値で「false」になるものは_.filter でブロックされるので配列に入れられない。
        return _.filter(array, _.identity);
    };


    var flatten = function(input, shallow, strict, startIndex) {
        //空の変数を作成
        var output = [],
            idx = 0;
        for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            // 各値が配列、argumentsである場合
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {

              　// 第2引数が「true」指定されている時は再帰処理しない。1回しか配列を解消しない。
                if (!shallow) value = flatten(value, shallow, strict);
                var j = 0,
                    len = value.length;
                output.length += len;
                // 各値が配列でない時、 j = 0 < len = 0 なのでこの処理は行われない。
                while (j < len) {
                    output[idx++] = value[j++];
                }
            } else if (!strict) {
              　// 各値が結果出力用の配列に入れられる。
                output[idx++] = value;
            }
        }
        return output;
    };

    /*
    第1引数「配列」のみの時は、入れ子の配列を単純な配列（入れ子なし）にしてくれる。
    第2引数で「true」が指定されている時は、一番浅い配列だけを解消する。
    */
    _.flatten = function(array, shallow) {
        //flattenに引数を渡す
        return flatten(array, shallow, false);
    };

    /*
    第1引数「配列」から第2引数の値を配列から省いた配列を返す。
    */
    _.without = function(array) {
        // 第1引数「配列」と第2引数以降が配列となって渡される。
        return _.difference(array, slice.call(arguments, 1));
    };

    /*
    引数「配列」の各値の中で同じ値があった場合、1つだけにされ（他のindex値の値は削除）各値が重複のない配列として返される。
    */
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {

        // _.isBoolean() は「true」「false」の時、trueを返すので 第2引数が「undefined」「null」の時などの処理。
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        // iteratee が空じゃない時。
        if (iteratee != null) iteratee = cb(iteratee, context);
        var result = [];
        var seen = [];
        // 各値を処理するforループ。
        for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
                // iteratee がある時は iteratee で第1引数「配列」の値を処理した結果。iteratee がない場合は値そのまま。
                computed = iteratee ? iteratee(value, i, array) : value;
            // isSorted = true の時の処理。
            if (isSorted) {
                // 前の値と違う時
                if (!i || seen !== computed) result.push(value);
                seen = computed;
            } else if (iteratee) {
                // iteratee = true の時の処理。
                // seen配列に値がない時。
                if (!_.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            // 引数が配列のみで、値が result 配列にない時。
            } else if (!_.contains(result, value)) {
                result.push(value);
            }
        }
        // 重複していない値が入る配列が返される。
        return result;
    };

    /*
    複数の引数「配列」を一つにまとめ、重複した値を削除し各値が重複のない配列として返される。
    */
    _.union = function() {
        // 内部関数flatten()引数がに渡される。argumentsは1番浅い配列だけ解消され、一つの配列としてまとめられる。
        // flattenで返ってきた値が_.uniq()を通り、重複した値は消され、重複のない配列となって返される。
        return _.uniq(flatten(arguments, true, true));
    };

    /*
    第1引数「配列」の各値が第2引数以降の引数（配列）に含まれている値のみの配列を返す。
    */
    _.intersection = function(array) {
        var result = [];
        // 引数の長さを抽出。
        var argsLength = arguments.length;

        // arrayの数の文だけループ処理
        for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];
            // result配列に値があったら、この値の処理をskip。次の値を処理。
            if (_.contains(result, item)) continue;
            // 第2引数以降の引数（配列）に第1引数の各値がなかったら break。
            for (var j = 1; j < argsLength; j++) {
              　// 第1引数の値が第2引数以降の配列にそれぞれ同じ値があったら、result配列に入れる。
                if (!_.contains(arguments[j], item)) break;
            }
            if (j === argsLength) result.push(item);
        }
        return result;
    };

    /*
    第2引数以降をまとめた配列の各値を省いた第1引数（配列）が返る。
    */
    _.difference = function(array) {
        // 第2引数をまとめた配列 = rest。
        // 第2引数以降の引数（配列）が入れ子の場合は一つだけしか解消しない。第2引数以降の引数でObjectがある場合は、そのObjectの値は入らない。
        var rest = flatten(arguments, true, true, 1);
        // _.filter() 処理された配列が返る。
        return _.filter(array, function(value) {
            // restに含まれる値がある時は「false」を返す。
            return !_.contains(rest, value);
        });
    };

    /*
    引数である各配列のindex値の値をまとめた配列を作る。
    返される配列のlengthは引数の中で1番長いlengthを持つ配列と同じ長さになる。
    */
    _.zip = function() {
      //_.unzip()に引数を渡す
      return _.unzip(arguments);
    };

    /*
    引数である各配列のindex値の値をまとめた配列を作る。
    返される配列のlengthは引数の中で1番長いlengthを持つ配列と同じ長さになる。
    */
    _.unzip = function(array) {
        // それぞれの引数（配列）の中で1番大きい length の値が length になる。
        var length = array && _.max(array, getLength).length || 0;
        // 結果用の配列作成。
        var result = Array(length);

        // _.pluck() により各配列のそれぞれの index の値を抽出した配列をresult配列に格納する。
        for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
        }
        return result;
    };

    /*
    2つの引数（配列）をとり、それぞれをkey値とval値に設定したObjectを返す。
    */
    _.object = function(list, values) {
        //結果用の配列を用意
        var result = {};
        //listの数ループ処理
        for (var i = 0, length = getLength(list); i < length; i++) {
            if (values) {
                // 第2引数がtureなら結果用の配列にkeyとvalueを入れていく
                result[list[i]] = values[i];
            } else {
              　// 第1引数のみなら、第一引数の中でkeyとvalueを入れていく
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

// ここから不明▼

    function createPredicateIndexFinder(dir) {
        return function(array, predicate, context) {
            //cb関数に引数を渡す
            predicate = cb(predicate, context);
            //arrayのlengthを取得
            var length = getLength(array);
            //引数dirが0以上なら0,そうでなければlengthから-1した値を代入
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) return index;
            }
            return -1;
        };
    }


    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);


    _.sortedIndex = function(array, obj, iteratee, context) {
        iteratee = cb(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0,
            high = getLength(array);
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1;
            else high = mid;
        }
        return low;
    };


    function createIndexFinder(dir, predicateFind, sortedIndex) {
        return function(array, item, idx) {
            var i = 0,
                //arayyのlengthを取得
                length = getLength(array);
                //idxの型が数字の場合
            if (typeof idx == 'number') {
              　//もしdirがoより大きかったら
                if (dir > 0) {
                  　
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else {
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                }
            } else if (sortedIndex && idx && length) {
                idx = sortedIndex(array, item);
                return array[idx] === item ? idx : -1;
            }
            if (item !== item) {
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                if (array[idx] === item) return idx;
            }
            return -1;
        };
    }

    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
//ここまで▲

    /*
    第1引数から第2引数 - 1までの数字の入った配列を返す関数。
    引数が1つの時は0から引数 - 1までの数字の入った配列を返す。
    */
    _.range = function(start, stop, step) {
      // 第2引数がnullなら
        if (stop == null) {
          　//stopはstartまたは0
            stop = start || 0;
            //startは0
            start = 0;
        }
        //stepはstepまたは0
        step = step || 1;

        //ceil関数は小数点以下の値を切り上げした結果を返します。
        //stopからstartを引き、stepで割った数の四捨五入した数字と0の最大の数を取得
        var length = Math.max(Math.ceil((stop - start) / step), 0);

        var range = Array(length);
        // step毎の値をlength 分格納するforループ。
        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };

    // Function (ahem) Functions
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
        if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
        var self = baseCreate(sourceFunc.prototype);
        var result = sourceFunc.apply(self, args);
        if (_.isObject(result)) return result;
        return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    _.bind = function(func, context) {
        if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
        var args = slice.call(arguments, 2);
        var bound = function() {
            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
        };
        return bound;
    };

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder, allowing any combination of arguments to be pre-filled.
    _.partial = function(func) {
        var boundArgs = slice.call(arguments, 1);
        var bound = function() {
            var position = 0,
                length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
                args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
            }
            while (position < arguments.length) args.push(arguments[position++]);
            return executeBound(func, bound, this, this, args);
        };
        return bound;
    };

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    _.bindAll = function(obj) {
        var i, length = arguments.length,
            key;
        if (length <= 1) throw new Error('bindAll must be passed function names');
        for (i = 1; i < length; i++) {
            key = arguments[i];
            obj[key] = _.bind(obj[key], obj);
        }
        return obj;
    };

    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
        var memoize = function(key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    _.throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            var last = _.now() - timestamp;

            if (last < wait && last >= 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function() {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    _.negate = function(predicate) {
        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
        var args = arguments;
        var start = args.length - 1;
        return function() {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
        };
    };

    // Returns a function that will only be executed on and after the Nth call.
    _.after = function(times, func) {
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    _.before = function(times, func) {
        var memo;
        return function() {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = _.partial(_.before, 2);

    // Object Functions
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
    var hasEnumBug = !{
        toString: null
    }.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    function collectNonEnumProps(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

        // Constructor is a special case.
        var prop = 'constructor';
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    }

  　/*
    引数のkey値をまとめた配列を返す。
    */
    _.keys = function(obj) {
        // 引数が Object じゃない時、空の配列を返す
        if (!_.isObject(obj)) return [];
        // Underscore 内部で nativeKeys = Object.keys; が宣言されているので、あれば適用。
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        // Object の key値 を抽出して obj が key値 を持っていたら、 keys 配列に入れるforループ。
        for (var key in obj) if (_.has(obj, key)) keys.push(key);
        // IE9用?
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        //結果を返す
        return keys;
    };

    // 引数のkey値をまとめた配列を返す。
    _.allKeys = function(obj) {
      　//引数がobjectでなければ空の配列を返す
        if (!_.isObject(obj)) return [];
        var keys = [];
        // Object のkey値を抽出してkeys配列に入れるforループ。
        for (var key in obj) keys.push(key);
        // Ahem, IE < 9.
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // 引数の「Object」に含まれる値、全て入った配列を返す。
    _.values = function(obj) {
      　// Object の key 配列を作る
        var keys = _.keys(obj);
        // keysのlengthを取得
        var length = keys.length;
        //length の長さ分の配列を作る。
        var values = Array(length);
        // obj の値の全てを配列に入れるforループ。
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    //第1引数「Object」の各値に第2引数で指定した関数を適用した第1引数を返す。
    _.mapObject = function(obj, iteratee, context) {
        // 引数に渡っているかを確認
        iteratee = cb(iteratee, context);
        // 第1引数のkey値を抽出した配列を作る。
        var keys = _.keys(obj),
        　　// 配列の長さを抽出。
            length = keys.length,
            results = {},
            currentKey;
        // 第1引数のObjectの各値に第2引数の関数を適用するforループ。
        for (var index = 0; index < length; index++) {
            currentKey = keys[index];
            // 第2引数の関数に第1引数の各値とそのkey値と第1引数自身を渡す。
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }
        // 関数を適用した第1引数を返す。
        return results;
    };

    // 引数「Object」の各key値とその値をペアにした配列を値とする入れ子の配列を返す
    _.pairs = function(obj) {
      　// 第1引数のkey値を抽出した配列を作る。
        var keys = _.keys(obj);
        // 配列の長さを抽出。
        var length = keys.length;
        // 結果用の空の配列を作成する。
        var pairs = Array(length);
        // key値とその値を入れた配列を作るforループ。s
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // 引数のkeyとvalueを入れ替えた値を返す
    _.invert = function(obj) {
        var result = {};
        // 第1引数のkey値を抽出した配列を作る。
        var keys = _.keys(obj);
        // 引数のkey値とその値を入れ替えたObjectを作るforループ。
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // objectのkyeの値をsortして返す
    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {
          　//objectのkeyの長さを取得し、name配列にpush
            if (_.isFunction(obj[key])) names.push(key);
        }
        //name配列の中をsort関数で並び替えて値を返す
        return names.sort();
    };

    // 第2引数「Object」に含まれている全てのプロパティ（プロトタイプを含む。）を第1引数「Object」にコピーしたものを返す。
    _.extend = createAssigner(_.allKeys);


    //第2引数「Object」に含まれている全てのプロパティを第1引数「Object」にコピーしたものを返す。
    _.extendOwn = _.assign = createAssigner(_.keys);

    //第1引数「Object」の値の中で第2引数の関数の条件を満たしている最初のkey値が返される。
    _.findKey = function(obj, predicate, context) {
        // 第3引数が入力されていない、第2引数が関数ならそのまま。
        predicate = cb(predicate, context);
        // Objectのkey値のみの配列を作成。
        var keys = _.keys(obj),
            key;
        // Objectの各値が第2引数の関数に適用されるforループ。
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // 引数から第2引数以降で指定したkey値とその値で構成されたObjectを返す。
    _.pick = function(object, oiteratee, context) {

        var result = {}, obj = object,
            iteratee, keys;
        // 第1引数がnullだったらresultを返す。
        if (obj == null) return result;

        //第2引数が関数なら
        if (_.isFunction(oiteratee)) {
          　// 第1引数のkey値をまとめた配列を作成。
            keys = _.allKeys(obj);
            // 第2引数が関数で context = undefined ならそのまま。
            iteratee = optimizeCb(oiteratee, context);
        } else {
          　// 第2引数以降が配列としてまとめる。
            keys = flatten(arguments, false, false, 1);
            // 受け取った「Object」に受け取ったkey値があるかの真偽値を返す関数。
            iteratee = function(value, key, obj) {
                return key in obj;
            };

            // 第1引数をオブジェクトラッパーで包む。
            obj = Object(obj);
        }
        // 第2引数で指定されたkey値（か関数）とその値で構成されたObjectを作成するforループ。
        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
        }
        // 結果のObjectを返す。
        return result;
    };

    // 第1引数から第2引数以降で指定したkey値以外のkey値とその値で構成されたObjectを返す。
    _.omit = function(obj, iteratee, context) {
       // 第2引数が関数なら
        if (_.isFunction(iteratee)) {
            // 関数の返す真偽値の反対を返す関数を返す。
            iteratee = _.negate(iteratee);
        } else {

            // 第2引数以降をまとめた配列。
            var keys = _.map(flatten(arguments, false, false, 1), String);
            // 第2引数以降をまとめた配列に入力されたkey値が含まれていたら、false を返す関数。
            iteratee = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        // 第1引数と条件によって設定された iteratee が _.pick() に渡される。
        return _.pick(obj, iteratee, context);
    };

    // 不明▼
    _.defaults = createAssigner(_.allKeys, true);

    // Creates an object that inherits from the given prototype object.
    // If additional properties are provided then they will be added to the
    // created object.
    _.create = function(prototype, props) {
        var result = baseCreate(prototype);
        if (props) _.extendOwn(result, props);
        return result;
    };

    // 引数が「Object」だった場合、コピーして返す。配列は配列、ObjectはObject、argumentsはargumentsとして返す。
    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;
        // 引数が配列だったら obj.slice、配列以外（ arguments含む ）だったら空のObjectにコピーするs
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // 第2引数のkey値とその値が第1引数に含まれていたら「true」を返すが第2引数に違うkey値があった場合は「false」を返す関数。
    _.isMatch = function(object, attrs) {
        // 第2引数の key 値の配列を作成。
        var keys = _.keys(attrs),
            //lengthを抽出
            length = keys.length;
        // 第1引数 == null だったら
        if (object == null) return !length;
        // 第1引数 を Objectラッパーで包む
        var obj = Object(object);
        // 第2引数のkey値とその値が第1引数に含まれているかを調べるforループ
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            // 第2引数と第1引数の key値 とその値が違うか、Objectラッパーで包まれた第1引数に key値 が含まれなかったら false を返す。
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    };

//不明ここから▼
    // Internal recursive comparison function for `isEqual`.
    var eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;
        // Unwrap any wrapped objects.
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
                // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = _.keys(a),
                key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (_.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };


    _.isEqual = function(a, b) {
        return eq(a, b);
    };
//不明ここまで▲

    // 引数が null か Object や配列で length === 0 の時、「true」を返す。
    _.isEmpty = function(obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
        return _.keys(obj).length === 0;
    };

    // 引数が nodeType === 1 の時、 true を返す。
    // nodeType = 1 はエレメント(要素)ノード
    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    // 引数のデータ型を判定。 引数のデータ型がfunctionまたはobjectで、引数がnullじゃない時、trueを返す。
    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !! obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // 引数がArgumentsだった時にtrueを返す。
    if (!_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // typeof 引数 == "function" だった時に「true」を返す。
    if (typeof / . / != 'function' && typeof Int8Array != 'object') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    // 引数が数字で有限数だった時にtrueを返す。
    _.isFinite = function(obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    //引数がNaNだった時に「true」を返す
    //NaN(ナン)とは、Not A Numberの略で、数値ではないことを表す、特別な値
    _.isNaN = function(obj) {
        return _.isNumber(obj) && obj !== +obj;
    };

    // 引数が真偽値だった時に「true」を返す。
    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    //引数がnullだった時にtrueを返す。
    _.isNull = function(obj) {
        return obj === null;
    };

    //引数が void 0 だった時にtrueを返す。
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    /*
    第1引数「Object」の中で第2引数の値をkeyとして持っていた場合、trueを返す。
    */
    _.has = function(obj, key) {
      // _内で hasOwnProperty = ObjProto.hasOwnProperty; が宣言されている。
      // obj が空でない場合は、key があれば true が返される。
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // -----------------

    /*
     _ という文字をundefinedにし、Undescoreの各メソッドを別の文字に移譲する関数。
    */
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    //引数をそのまま返す関数
    _.identity = function(value) {
        return value;
    };

    /*
    受け取った引数をそのまま返すを返す。
    */
    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    //空の関数を返す。
    _.noop = function() {};

    _.property = property;

    // Generates a function for a given object that returns a given property.
    _.propertyOf = function(obj) {
        return obj == null ? function() {} : function(key) {
            return obj[key];
        };
    };

    _.matcher = _.matches = function(attrs) {
        // attrsがObjectだった時に「key : val」セットでコピー。
        attrs = _.extendOwn({}, attrs);

        return function(obj) {
            // 引数（obj）に部分適用した attrs と同じ「key : val」があった場合trueを返す。
            return _.isMatch(obj, attrs);
        };
    };

    // 第1引数の数 、第2引数の関数を実行する。実行した結果の配列を返す
    _.times = function(n, iteratee, context) {
        // 引数「n」と0のどちらか大きい数の length を持つ配列を作成。
        var accum = Array(Math.max(0, n));
        // context = undefined の場合は そのままの iteratee が返る。
        iteratee = optimizeCb(iteratee, context, 1);
        // 第2引数に「 i 」を渡して実行した結果を accum 配列に入れる
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        // 結果を入れた配列を返す。  
        return accum;
    };

    // Return a random integer between min and max (inclusive).
    _.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    _.now = Date.now || function() {
        return new Date().getTime();
    };

    // List of HTML entities for escaping.
    var escapeMap = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": ''',
        '`': '`'
    };
    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    var createEscaper = function(map) {
        var escaper = function(match) {
            return map[match];
        };
        // Regexes for identifying a key that needs to be escaped
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    _.result = function(object, property, fallback) {
        var value = object == null ? void 0 : object[property];
        if (value === void 0) {
            value = fallback;
        }
        return _.isFunction(value) ? value.call(object) : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    _.template = function(text, settings, oldSettings) {
        if (!settings && oldSettings) settings = oldSettings;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
        (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';

        try {
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.
    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.
    var result = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(_, args));
            };
        });
    };

    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    // Extracts the result from a wrapped and chained object.
    _.prototype.value = function() {
        return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
        return '' + this._wrapped;
    };

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}.call(this));
