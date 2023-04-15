import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';

function Example() {
  return (
    <div className="w-full px-4 pt-16">
      <div className="bg-white mx-auto w-full max-w-md rounded-2xl p-2">
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500 flex w-full justify-between rounded-lg px-4 py-2 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                <span>What is your refund policy?</span>
                <ChevronUpIcon
                  className={`${open ? 'rotate-180 transform' : ''} text-purple-500 h-5 w-5`}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="text-gray-500 px-4 pb-2 pt-4 text-sm">
                If you re unhappy with your purchase for any reason, email us within 90 days and wel
                l refund you in full, no questions asked.
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        <Disclosure as="div" className="mt-2">
          {({ open }) => (
            <>
              <Disclosure.Button className="bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500 flex w-full justify-between rounded-lg px-4 py-2 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                <span>Do you offer technical support?</span>
                <ChevronUpIcon
                  className={`${open ? 'rotate-180 transform' : ''} text-purple-500 h-5 w-5`}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="text-gray-500 px-4 pb-2 pt-4 text-sm">
                No.
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
}

const Config = () => (
  <div>
    <Example />
  </div>
);
export default Config;
