import { useState } from "react";

function useReactionModal() {
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const handleReactionOnClick = () => {
    setIsReactionsModalOpen(true);
  };
  const handleReactionModalClose = () => {
    setIsReactionsModalOpen(false);
  };

  return {
    isReactionsModalOpen,
    handleReactionOnClick,
    handleReactionModalClose,
  };
}

export default useReactionModal;
