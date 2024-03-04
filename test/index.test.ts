import { isVideoFile, encodeVideo } from "../index";

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

describe("encodeVideo", () => {
  test("should encode video file", () => {
    // Mocking exec function
    const execMock = jest.fn();
    require("child_process").exec = execMock;

    // Call encodeVideo function
    encodeVideo("video.mp4");

    const directoryToMonitor = "./test/library1";
    expect(execMock).toHaveBeenCalled();
    // expect(execMock).toHaveBeenCalledWith(
    //   `HandBrakeCLI -i "${directoryToMonitor}/video.mp4" -o "${directoryToMonitor}/encoded_video.mp4"`
    // );

    // Verify exec function called with correct arguments
    // expect(execMock).toHaveBeenCalledWith('HandBrakeCLI -i "/path/to/your/directory/video.mp4" -o "/path/to/your/directory/encoded_video.mp4"', expect.any(Function));
  });
});
