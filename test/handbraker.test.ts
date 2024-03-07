import { isVideoFile, renameFile, parsePath } from "../handbraker";

// jest.mock("../index", () => {
//   const originalModule = jest.requireActual("../index");
//   return {
//     __esModule: true,
//     ...originalModule,
//     main: () => {},
//   };
// });

test("parsePath test", () => {
  const testItems = [
    {
      in: "test/library1/foo/bar.txt",
      out: ["bar.txt", "test/output/foo"],
    },
    {
      in: "test/library1/foo/bar/bang/baz.txt",
      out: ["baz.txt", "test/output/foo/bar/bang"],
    },
    {
      in: "test/library1/The.Mandalorian.S03E01.mkv",
      out: ["The.Mandalorian.S03E01.mkv", "test/output"],
    },
  ];
  for (const item of testItems) {
    expect(parsePath(item.in, "test/library1", "test/output")).toEqual(
      item.out
    );
  }
});

describe("renameFile tests", () => {
  test("Simple renaming", () => {
    const testItems = [
      [
        "The.Mandalorian.S03E01.720p.WEBRip.x264-DocPlexReady.mkv",
        "The Mandalorian - S03E01.mkv",
      ],
      [
        "The.Mandalorian.Episode.One.S01E02.720p.WEBRip.x264-DocPlexReady.mp4",
        "The Mandalorian Episode One - S01E02.mp4",
      ],
      [
        "Hedwig.And.The.Angry.Inch.2001.1080p.BluRay.x265.mp4",
        "Hedwig And The Angry Inch (2001).mp4",
      ],
      [
        "This.Is.Spinal.Tap.1984.1080p.BluRay.x265-LAMA.mov",
        "This Is Spinal Tap (1984).mov",
      ],
    ];
    for (const item of testItems) {
      expect(renameFile(item[0])).toEqual(item[1]);
    }
  });
});

describe("isVideoFile", () => {
  test("should return true for valid video file extensions", () => {
    expect(isVideoFile("video.mp4")).toBe(true);
    expect(isVideoFile("movie.mkv")).toBe(true);
    expect(isVideoFile("film.avi")).toBe(true);
    expect(isVideoFile("animation.mov")).toBe(true);
  });

  test("should return false for invalid file extensions", () => {
    expect(isVideoFile("document.pdf")).toBe(false);
    expect(isVideoFile("image.jpg")).toBe(false);
    expect(isVideoFile("audio.mp3")).toBe(false);
  });
});

// describe("encodeVideo", () => {
//   test("should encode video file", () => {
//     // Mocking exec function
//     const execMock = jest.fn();
//     require("child_process").exec = execMock; // No longer working.

//     // Call encodeVideo function
//     encodeVideo("in/video.mp4", "out/video.mp4");
//     // tmp expect(execMock).toHaveBeenCalled();

//     // Not working :/
//     // expect(execMock).toHaveBeenCalledWith(
//     //   `HandBrakeCLI -i "${directoryToMonitor}/video.mp4" -o "${directoryToMonitor}/encoded_video.mp4"`, expect.any(Function)
//     // );
//   });
// });
