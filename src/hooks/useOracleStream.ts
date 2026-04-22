import { useCompletion } from "@ai-sdk/react";

export const useOracleStream = () => {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/oracle",
    onFinish: (completion) => {
      console.log("[ORACLE_STREAM_COMPLETED]", completion.length, "bytes recieved.");
    },
    onError: (err) => {
      console.error("[ORACLE_STREAM_FATAL]", err);
    }
  });

  return {
    oracleText: completion,
    prompt: input,
    setPrompt: handleInputChange,
    submit: handleSubmit,
    isInferring: isLoading,
    error,
  };
};
