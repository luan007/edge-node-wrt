/*
The summary is as followed
•V8 Array is Fast, VERY FAST 
•Array push / pop / shift is ~approx 20x+ faster than any object equivalent.
•Surprisingly Array.shift() is fast ~approx 6x slower than an array pop, but is ~approx 100x faster than an object attribute deletion.
•Amusingly, Array.push( data ); is faster than Array[nextIndex] = data by almost 20 times over.
•Array.unshift(data) is slower as expected, and is ~approx 5x slower than a new property adding.
•Nulling the value array[index] = null is faster than deleting it delete array[index] (undefined) in an array by ~approx 4x++ faster.
•Surprisingly Nulling a value in an object is obj[attr] = null ~approx 2x slower than just deleting the attribute delete obj[attr]
•Unsurprisingly, mid array Array.splice(index,0,data) is slow, very slow. 
•Surprisingly, Array.splice(index,1,data) has been optimized (no length change) and is 100x faster than just splice Array.splice(index,0,data)
•unsurprisingly, the divLinkedList is inferior to an array on all sectors, except dll.splice(index,1) removal (Where it broke the test system).
•BIGGEST SURPRISE of it all [as jjrv pointed out], V8 array writes are slightly faster than V8 reads =O
*/



/*
* A fast(hopefully) implementation that allows :
* [ a, b, c, d ]
*      ^
*     pop(b)
*/

class ExtendedArray<T> {

    private freePos: Array<number> = [];
    private data: Array<T>;
    private generation: Array<number>;

    constructor(initialCapacity?: number) {
        this.data = new Array(initialCapacity || 2048);
        this.generation = new Array(initialCapacity || 2048);
        for (var i = this.data.length - 1; i >= 0; i--) {
            this.freePos.push(i);
            this.generation[i] = 0;
        }
    }

    push = (d: T) => {
        var pos = this.data.length;
        if (this.freePos.length > 0) {
            pos = this.freePos.pop();
            this.data[pos] = d;
            this.generation[pos]++;
        }
        else {
            this.data.push(d);
            this.generation.push(0);
        }
        return pos;
    };

    pop(pos: number): T {
        var data = this.data[pos];
        this.data[pos] = undefined;
        if (data) {
            this.freePos.push(pos);
        }
        return data;
    }

    //get generation data
    age(pos: number): number {
        return this.generation[pos];
    }
}

export = ExtendedArray;