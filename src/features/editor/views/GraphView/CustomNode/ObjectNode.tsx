import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { useModal } from "../../../../../store/useModal";
import useGraph from "../stores/useGraph";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
};

const Row = ({ row, x, y, index }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
    >
      <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
      <TextRenderer>{getRowText()}</TextRenderer>
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    {/* Edit button (pointer-events enabled) */}
    <button
      aria-label="Edit node"
      onClick={e => {
        e.stopPropagation();
        const setVisible = useModal.getState().setVisible;
        const setSelectedNode = useGraph.getState().setSelectedNode;
        const setIsEditingNode = useGraph.getState().setIsEditingNode;
        if (setSelectedNode) setSelectedNode(node as NodeData);
        if (setIsEditingNode) setIsEditingNode(true);
        setVisible("NodeModal", true);
      }}
      style={{
        position: "absolute",
        top: 2,
        right: 2,
        zIndex: 5,
        pointerEvents: "all",
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 3,
        border: "none",
        background: "rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
    >
      Edit
    </button>
    {node.text.map((row, index) => (
      <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
