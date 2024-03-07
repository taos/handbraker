import { Queue } from "../queue";

describe("Queue tests", () => {
  test("queue tests", () => {
    const q = new Queue("qtestdir");
    q.clean();
    expect(q.size()).toEqual(0);
    q.push("one");
    expect(q.size()).toEqual(1);
    q.push("two");
    q.push("three");
    expect(q.all()).toEqual(["one", "two", "three"]); // maintain order
    expect(q.pop()).toEqual("one");
    expect(q.size()).toEqual(2);
    expect(q.shift()).toEqual("three");
    expect(q.pop()).toEqual("two");

    expect(q.pop()).toEqual("");
    expect(q.shift()).toEqual("");
    expect(q.remove(4)).toEqual("");
    expect(q.remove(-1)).toEqual("");
  });
});
