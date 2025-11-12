import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Textarea, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import useJson from "../../../store/useJson";
import toast from "react-hot-toast";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const editingFlag = useGraph(state => state.editingNode);
  const setIsEditingNode = useGraph(state => state.setIsEditingNode);

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  // Helper: get value at path from object
  const getValueAtPath = (obj: any, path?: NodeData["path"]) => {
    if (!path || path.length === 0) return obj;
    let cur: any = obj;
    for (const seg of path) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[seg as any];
    }
    return cur;
  };

  // Helper: set value at path (mutates obj)
  const setValueAtPath = (obj: any, path: NodeData["path"] | undefined, value: any) => {
    if (!path || path.length === 0) return value;
    let cur: any = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i] as any;
      if (typeof seg === "number") {
        if (!Array.isArray(cur[seg])) cur[seg] = [];
      } else {
        if (typeof cur[seg] !== "object" || cur[seg] === null) cur[seg] = {};
      }
      cur = cur[seg];
    }
    const last = path[path.length - 1] as any;
    cur[last] = value;
    return obj;
  };

  // initialize draft when nodeData changes or when modal opens
  React.useEffect(() => {
    if (!opened) {
      setIsEditing(false);
      setIsEditingNode(false);
      setError(null);
      return;
    }

    if (nodeData) {
      try {
        const fullJson = useJson.getState().getJson();
        const parsed = JSON.parse(fullJson);
        const val = getValueAtPath(parsed, nodeData.path);
        setDraft(JSON.stringify(val, null, 2));
      } catch (e) {
        setDraft(normalizeNodeData(nodeData?.text ?? []));
      }
    } else {
      setDraft("");
    }

    if (editingFlag) setIsEditing(true);
  }, [nodeData, opened, editingFlag]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsEditingNode(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingNode(false);
    setError(null);
    // reset draft from current node value
    if (nodeData) {
      try {
        const fullJson = useJson.getState().getJson();
        const parsed = JSON.parse(fullJson);
        const val = getValueAtPath(parsed, nodeData.path);
        setDraft(JSON.stringify(val, null, 2));
      } catch (e) {
        setDraft(normalizeNodeData(nodeData?.text ?? []));
      }
    }
  };

  const handleSave = () => {
    try {
      const parsedDraft = JSON.parse(draft);

      const fullJsonStr = useJson.getState().getJson();
      const full = JSON.parse(fullJsonStr);

      const updated = setValueAtPath(full, nodeData?.path, parsedDraft);
      const newJsonString = JSON.stringify(updated, null, 2);

      // update left editor first, then canonical json+graph
      useFile.getState().setContents({ contents: newJsonString, hasChanges: false, skipUpdate: true });
      useJson.getState().setJson(newJsonString);

      setError(null);
      setIsEditing(false);
      setIsEditingNode(false);
      onClose();
    } catch (e: any) {
      const msg = e?.message || "Invalid JSON";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal size="auto" opened={opened} onClose={() => { onClose(); setIsEditingNode(false); }} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <CloseButton onClick={() => { onClose(); setIsEditingNode(false); }} />
          </Flex>

          <ScrollArea.Autosize mah={350} maw={700}>
            {!isEditing ? (
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={700}
                language="json"
                withCopyButton
              />
            ) : (
              <Textarea
                value={draft}
                onChange={e => setDraft(e.currentTarget.value)}
                minRows={8}
                styles={{ input: { fontFamily: "monospace" } }}
              />
            )}
          </ScrollArea.Autosize>
        </Stack>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={700}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>

        {error && (
          <Text fz="xs" color="red">
            {error}
          </Text>
        )}

        <Group position="right">
          {!isEditing ? (
            <Button onClick={handleStartEdit} disabled={!nodeData}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
