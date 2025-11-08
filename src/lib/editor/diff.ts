// This file contains the core logic for the diffing algorithm.
// It is based on the prosemirror-changeset library, but adapted to our needs.
// The original library can be found at https://github.com/prosemirror/prosemirror-changeset

import { type Change, ChangeSet } from "prosemirror-changeset";
import {
  Fragment,
  type Node as ProsemirrorNode,
  type Schema,
  Slice,
} from "prosemirror-model";
import { Step } from "prosemirror-transform";

export enum DiffType {
  Inserted = "inserted",
  Deleted = "deleted",
}

export function diffEditor(
  schema: Schema,
  oldDoc: any,
  newDoc: any,
): ProsemirrorNode {
  const oldNode = schema.nodeFromJSON(oldDoc);
  const newNode = schema.nodeFromJSON(newDoc);

  const steps = getReplaceStep(oldNode, newNode).map((step) =>
    Step.fromJSON(schema, step),
  );
  const maps = steps.map((step) => step.getMap());

  const changeSet = ChangeSet.create(oldNode).addSteps(newNode, maps, []);

  const diffedNode = applyChangeSet(schema, oldNode, changeSet.changes);

  return diffedNode;
}

function getReplaceStep(oldDoc: ProsemirrorNode, newDoc: ProsemirrorNode) {
  const replaceStep = [];
  const from = 0;
  const to = oldDoc.content.size;
  const slice = newDoc.slice(from, newDoc.content.size);

  if (slice) {
    replaceStep.push({
      stepType: "replace",
      from,
      to,
      slice: slice.toJSON(),
    });
  }

  return replaceStep;
}

function applyChangeSet(
  schema: Schema,
  node: ProsemirrorNode,
  changes: readonly Change[],
): ProsemirrorNode {
  let modifiedNode = node;

  changes.forEach((change) => {
    const from = change.fromB;
    const to = change.toB;

    const insertedContent = node.type.contentMatch.defaultType?.createAndFill();

    if (insertedContent) {
      modifiedNode.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          const insertedMark = schema.marks.diffMark.create({
            type: DiffType.Inserted,
          });

          const textNode = schema.text(
            node.text?.substring(from - pos, to - pos) ?? "",
            [insertedMark],
          );

          modifiedNode = modifiedNode.replace(
            pos + (from - pos),
            pos + (to - pos),
            new Slice(Fragment.from(textNode), 0, 0),
          );
        }
      });
    }

    const deletedContent: ProsemirrorNode[] = [];
    node.nodesBetween(change.fromA, change.toA, (node) => {
      deletedContent.push(node);
    });

    deletedContent.forEach((deletedNode) => {
      if (deletedNode.isText) {
        const deletedMark = schema.marks.diffMark.create({
          type: DiffType.Deleted,
        });

        const textNode = schema.text(deletedNode.text ?? "", [
          ...(deletedNode.marks ?? []),
          deletedMark,
        ]);

        modifiedNode = modifiedNode.replace(
          from,
          from,
          new Slice(Fragment.from(textNode), 0, 0),
        );
      }
    });
  });

  return modifiedNode;
}
