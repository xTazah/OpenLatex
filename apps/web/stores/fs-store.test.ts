import { beforeEach, describe, expect, test } from "vitest";
import { useFsStore } from "./fs-store";

function resetStore() {
  useFsStore.setState({ root: null, tree: [], loading: false, error: null });
}

describe("useFsStore.applyEvent", () => {
  beforeEach(resetStore);

  test("adds a file inside a directory created in the same session", () => {
    const { applyEvent } = useFsStore.getState();
    applyEvent({ type: "addDir", path: "assets" });
    applyEvent({ type: "add", path: "assets/photo.jpg" });

    expect(useFsStore.getState().tree).toEqual([
      {
        path: "assets",
        type: "dir",
        mtime: expect.any(Number),
        children: [
          { path: "assets/photo.jpg", type: "file", mtime: expect.any(Number) },
        ],
      },
    ]);
  });

  test("adds a file inside an already-populated existing directory", () => {
    useFsStore.setState({
      tree: [
        {
          path: "assets",
          type: "dir",
          mtime: 1,
          children: [{ path: "assets/old.png", type: "file", mtime: 1 }],
        },
      ],
    });

    useFsStore.getState().applyEvent({ type: "add", path: "assets/new.jpg" });

    const [assetsNode] = useFsStore.getState().tree;
    expect(assetsNode.children?.map((c) => c.path)).toEqual([
      "assets/new.jpg",
      "assets/old.png",
    ]);
  });

  test("adds a file inside a deeply nested existing directory", () => {
    useFsStore.setState({
      tree: [
        {
          path: "chapters",
          type: "dir",
          mtime: 1,
          children: [
            { path: "chapters/sub", type: "dir", mtime: 1, children: [] },
          ],
        },
      ],
    });

    useFsStore
      .getState()
      .applyEvent({ type: "add", path: "chapters/sub/deep.tex" });

    const [chapters] = useFsStore.getState().tree;
    const sub = chapters.children?.[0];
    expect(sub?.children).toEqual([
      {
        path: "chapters/sub/deep.tex",
        type: "file",
        mtime: expect.any(Number),
      },
    ]);
  });

  test("does not duplicate a node that already exists", () => {
    useFsStore.setState({
      tree: [
        {
          path: "assets",
          type: "dir",
          mtime: 1,
          children: [{ path: "assets/photo.jpg", type: "file", mtime: 1 }],
        },
      ],
    });

    useFsStore.getState().applyEvent({ type: "add", path: "assets/photo.jpg" });

    const [assetsNode] = useFsStore.getState().tree;
    expect(assetsNode.children).toHaveLength(1);
  });
});
