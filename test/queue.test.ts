import { Queue } from "../queue";

describe("Queue tests", () => {
  test("Basic queue tests", () => {
    console.log("Basic queue test");
    const q = new Queue();
    q.clean();
    expect(q.size()).toEqual(0);
    q.push("one");
    expect(q.size()).toEqual(1);
    q.push("two");
    q.push("three");
    expect(q["load"]()).toEqual(["one", "two", "three"]); // maintain order
    expect(q.pop()).toEqual("one");
    expect(q.size()).toEqual(2);
    expect(q.shift()).toEqual("three");
    expect(q.pop()).toEqual("two");
    expect(q.pop()).toEqual("");
    expect(q.shift()).toEqual("");
    expect(q["remove"](4)).toEqual("");
    expect(q["remove"](-1)).toEqual("");
  });

  test("Multi queue tests", () => {
    const q = new Queue("backlog");
    q.clean();
    expect(q.size()).toEqual(0);
    q.push("foo/bar");
    const q2 = new Queue("running");
    q2.push("foo/bar/baz.txt");
    expect(q.pop()).toEqual("foo/bar");
    expect(q2.peek()).toEqual("foo/bar/baz.txt");
    q2.close();
  });
});
