/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useDate } from "@edifice-ui/react";

// TODO Move to edifice-ui (don't forget css) css

export type SummaryListProps = {
  /**
   * Items to display
   */
  list: SummaryListObject[];

  /**
   * Action on click
   */
  onClick?: (item: SummaryListObject) => void;
};

export type SummaryListObject = {
  id: string;
  title: string;
  date: string;
};

export const SummaryList = ({ list, onClick }: SummaryListProps) => {
  const { formatDate } = useDate();

  const displayDate = (date: string) => {
    return formatDate(date, "D MMMM YYYY");
  };

  const handleOnClick = (item: SummaryListObject) => {
    onClick?.(item);
  };

  return (
    <>
      {list.map((item) => (
        <div
          className="pb-8 d-flex summary-list-item flex-column "
          key={item.id}
          onClick={() => {
            handleOnClick(item);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="summary-list-item-title small flex-fill">
            {item.title}
          </div>
          <div className="summary-list-item-date small text-gray-700">
            {item.date && displayDate(item.date)}
          </div>
        </div>
      ))}
    </>
  );
};
