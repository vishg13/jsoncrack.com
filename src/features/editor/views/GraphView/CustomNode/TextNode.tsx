import React from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import useConfig from "../../../../../store/useConfig";
import type { NodeData } from "../../../../../types/graph";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { useModal } from "../../../../../store/useModal";
import useGraph from "../stores/useGraph";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 10px;
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));
  const value = text[0].value;

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
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
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
        >
          <Styled.StyledKey $value={value} $type={typeof text[0].value}>
            <TextRenderer>{value}</TextRenderer>
          </Styled.StyledKey>
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return prev.node.text === next.node.text && prev.node.width === next.node.width;
}

export const TextNode = React.memo(Node, propsAreEqual);
